"""
Project Store - Database layer for project management

Provides CRUD operations for projects using Turso DB.
Follows the pattern established in content_config.py.
"""

import os
import uuid
import json
from typing import Optional, List
from datetime import datetime

from utils.libsql_async import create_client

from api.models.project import (
    Project,
    ProjectSettings,
    TechStackDetection,
    ContentDirectoryConfig,
    ProjectConfigOverrides,
    OnboardingStatus,
)


_PROJECT_SELECT_COLUMNS = (
    "id, userId, name, url, type, description, isDefault, settings, "
    "lastAnalyzedAt, archivedAt, deletedAt, createdAt"
)


class ProjectStore:
    """
    Database store for project management.

    Uses the existing Project table from chatbot migrations.
    Stores tech_stack, content_directory, config_overrides in the 'settings' JSON field.
    """

    def __init__(self):
        """Initialize database client from environment variables."""
        self.db_client = None
        if os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN")
            )

    def _ensure_connected(self):
        """Ensure database client is available."""
        if not self.db_client:
            raise RuntimeError(
                "Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    async def ensure_table(self) -> None:
        """Create the Project table if it does not exist."""
        self._ensure_connected()

        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS Project (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'github',
                description TEXT,
                isDefault INTEGER NOT NULL DEFAULT 0,
                settings TEXT,
                lastAnalyzedAt INTEGER,
                archivedAt INTEGER,
                deletedAt INTEGER,
                createdAt INTEGER NOT NULL
            )
            """
        )

        await self._ensure_project_column("archivedAt", "INTEGER")
        await self._ensure_project_column("deletedAt", "INTEGER")

        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_project_userId
            ON Project(userId)
            """
        )

        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_project_userId_isDefault
            ON Project(userId, isDefault)
            """
        )

        await self.db_client.execute(
            """
            DROP INDEX IF EXISTS idx_project_userId_url
            """
        )

        await self.db_client.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_project_userId_url
            ON Project(userId, url)
            WHERE url IS NOT NULL AND url != '' AND deletedAt IS NULL
            """
        )

        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_project_userId_archived_deleted
            ON Project(userId, archivedAt, deletedAt)
            """
        )

    async def _ensure_project_column(
        self,
        column_name: str,
        column_definition: str,
    ) -> None:
        rs = await self.db_client.execute("PRAGMA table_info(Project)")
        existing = {
            row[1] for row in rs.rows if isinstance(row, (tuple, list)) and len(row) > 1
        }
        if column_name in existing:
            return
        await self.db_client.execute(
            f"ALTER TABLE Project ADD COLUMN {column_name} {column_definition}"
        )

    def _row_to_project(self, row: tuple) -> Project:
        """Convert database row to Project model."""
        # Row columns: id, userId, name, url, type, description, isDefault, settings,
        # lastAnalyzedAt, archivedAt, deletedAt, createdAt
        settings_json = row[7]
        settings = None
        if settings_json:
            try:
                settings_dict = json.loads(settings_json)
                settings = ProjectSettings(**settings_dict)
            except (json.JSONDecodeError, TypeError):
                settings = None

        return Project(
            id=row[0],
            user_id=row[1],
            name=row[2],
            url=row[3],
            type=row[4],
            description=row[5],
            is_default=bool(row[6]),
            settings=settings,
            last_analyzed_at=datetime.fromtimestamp(row[8]) if row[8] else None,
            archived_at=datetime.fromtimestamp(row[9]) if row[9] else None,
            deleted_at=datetime.fromtimestamp(row[10]) if row[10] else None,
            created_at=datetime.fromtimestamp(row[11])
        )

    async def create(
        self,
        user_id: str,
        name: str,
        url: str = "",
        description: Optional[str] = None,
        project_type: str = "manual"
    ) -> Project:
        """
        Create a new project.

        Args:
            user_id: Owner user ID
            name: Project name
            url: Project source URL (can be empty for manual projects)
            description: Optional description
            project_type: Source type (default: manual)

        Returns:
            Created Project
        """
        self._ensure_connected()

        project_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp())

        # Initial settings with pending status
        initial_settings = ProjectSettings(
            onboarding_status=OnboardingStatus.PENDING
        )
        settings_json = initial_settings.model_dump_json()

        normalized_name = name.strip() or "Untitled project"
        normalized_url = (url or "").strip()

        await self.db_client.execute(
            """
            INSERT INTO Project (id, userId, name, url, type, description, isDefault, settings, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                project_id,
                user_id,
                normalized_name,
                normalized_url,
                project_type,
                description,
                False,
                settings_json,
                now,
            ]
        )

        return Project(
            id=project_id,
            user_id=user_id,
            name=normalized_name,
            url=normalized_url,
            type=project_type,
            description=description,
            is_default=False,
            settings=initial_settings,
            last_analyzed_at=None,
            archived_at=None,
            deleted_at=None,
            created_at=datetime.fromtimestamp(now)
        )

    async def get_by_id(
        self,
        project_id: str,
        *,
        include_deleted: bool = False,
    ) -> Optional[Project]:
        """
        Get project by ID.

        Args:
            project_id: Project ID

        Returns:
            Project if found, None otherwise
        """
        self._ensure_connected()

        where_deleted = "" if include_deleted else " AND deletedAt IS NULL"
        rs = await self.db_client.execute(
            f"""
            SELECT {_PROJECT_SELECT_COLUMNS}
            FROM Project
            WHERE id = ?{where_deleted}
            """,
            [project_id],
        )

        if rs.rows:
            return self._row_to_project(rs.rows[0])
        return None

    async def get_by_user(
        self,
        user_id: str,
        *,
        include_archived: bool = True,
        include_deleted: bool = False,
    ) -> List[Project]:
        """
        Get all projects for a user.

        Args:
            user_id: User ID

        Returns:
            List of projects
        """
        self._ensure_connected()

        filters = ["userId = ?"]
        if not include_archived:
            filters.append("archivedAt IS NULL")
        if not include_deleted:
            filters.append("deletedAt IS NULL")
        where_clause = " AND ".join(filters)
        rs = await self.db_client.execute(
            f"""
            SELECT {_PROJECT_SELECT_COLUMNS}
            FROM Project
            WHERE {where_clause}
            ORDER BY createdAt DESC
            """,
            [user_id],
        )

        return [self._row_to_project(row) for row in rs.rows]

    async def get_default_project(self, user_id: str) -> Optional[Project]:
        """
        Get the user's default project.

        Args:
            user_id: User ID

        Returns:
            Default project if set, None otherwise
        """
        self._ensure_connected()

        rs = await self.db_client.execute(
            """
            SELECT id, userId, name, url, type, description, isDefault, settings,
                   lastAnalyzedAt, archivedAt, deletedAt, createdAt
            FROM Project
            WHERE userId = ? AND isDefault = 1 AND archivedAt IS NULL AND deletedAt IS NULL
            LIMIT 1
            """,
            [user_id]
        )

        if rs.rows:
            return self._row_to_project(rs.rows[0])
        return None

    async def update_settings(
        self,
        project_id: str,
        settings: ProjectSettings
    ) -> Optional[Project]:
        """
        Update project settings.

        Args:
            project_id: Project ID
            settings: New settings

        Returns:
            Updated project
        """
        self._ensure_connected()

        settings_json = settings.model_dump_json()

        await self.db_client.execute(
            """
            UPDATE Project
            SET settings = ?
            WHERE id = ?
            """,
            [settings_json, project_id]
        )

        return await self.get_by_id(project_id)

    async def update_onboarding_status(
        self,
        project_id: str,
        status: OnboardingStatus,
        tech_stack: Optional[TechStackDetection] = None,
        content_directories: Optional[List[ContentDirectoryConfig]] = None,
        local_repo_path: Optional[str] = None
    ) -> Optional[Project]:
        """
        Update onboarding status and optionally detection results.

        Args:
            project_id: Project ID
            status: New onboarding status
            tech_stack: Detected tech stack
            content_directories: All detected/configured content directories
            local_repo_path: Path to cloned repository

        Returns:
            Updated project
        """
        project = await self.get_by_id(project_id)
        if not project:
            return None

        settings = project.settings or ProjectSettings()
        settings.onboarding_status = status

        if tech_stack:
            settings.tech_stack = tech_stack
        if content_directories is not None:
            settings.content_directories = content_directories
        if local_repo_path:
            settings.local_repo_path = local_repo_path

        return await self.update_settings(project_id, settings)

    async def update_last_analyzed(self, project_id: str) -> Optional[Project]:
        """
        Update the last analyzed timestamp.

        Args:
            project_id: Project ID

        Returns:
            Updated project
        """
        self._ensure_connected()

        now = int(datetime.now().timestamp())

        await self.db_client.execute(
            """
            UPDATE Project
            SET lastAnalyzedAt = ?
            WHERE id = ?
            """,
            [now, project_id]
        )

        return await self.get_by_id(project_id)

    async def set_default(self, user_id: str, project_id: str) -> Optional[Project]:
        """
        Set a project as the user's default.

        Args:
            user_id: User ID
            project_id: Project ID to set as default

        Returns:
            Updated project
        """
        self._ensure_connected()

        project = await self.get_by_id(project_id)
        if (
            project is None
            or project.user_id != user_id
            or project.archived_at is not None
            or project.deleted_at is not None
        ):
            return None

        # First, unset all defaults for this user
        await self.db_client.execute(
            """
            UPDATE Project
            SET isDefault = 0
            WHERE userId = ?
            """,
            [user_id]
        )

        # Then set the new default
        await self.db_client.execute(
            """
            UPDATE Project
            SET isDefault = 1
            WHERE id = ? AND userId = ? AND archivedAt IS NULL AND deletedAt IS NULL
            """,
            [project_id, user_id]
        )

        return await self.get_by_id(project_id)

    async def update(
        self,
        project_id: str,
        name: Optional[str] = None,
        url: Optional[str] = None,
        project_type: Optional[str] = None,
        description: Optional[str] = None,
        content_directories: Optional[List[ContentDirectoryConfig]] = None,
        config_overrides: Optional[ProjectConfigOverrides] = None,
        analytics_enabled: Optional[bool] = None,
    ) -> Optional[Project]:
        """
        Update project details.

        Args:
            project_id: Project ID
            name: New name
            description: New description
            content_directories: New content directories config
            config_overrides: New config overrides
            analytics_enabled: Enable/disable cookie-free analytics

        Returns:
            Updated project
        """
        self._ensure_connected()

        project = await self.get_by_id(project_id)
        if not project:
            return None

        # Update basic fields if provided
        updates = []
        params = []

        if name is not None:
            updates.append("name = ?")
            params.append(name.strip() or "Untitled project")

        if url is not None:
            updates.append("url = ?")
            params.append(url.strip())

        if project_type is not None:
            updates.append("type = ?")
            params.append(project_type)

        if description is not None:
            updates.append("description = ?")
            params.append(description)

        if updates:
            params.append(project_id)
            await self.db_client.execute(
                f"UPDATE Project SET {', '.join(updates)} WHERE id = ?",
                params
            )

        # Update settings if needed
        if content_directories is not None or config_overrides or analytics_enabled is not None:
            settings = project.settings or ProjectSettings()
            if content_directories is not None:
                settings.content_directories = content_directories
            if config_overrides:
                settings.config_overrides = config_overrides
            if analytics_enabled is not None:
                settings.analytics_enabled = analytics_enabled
            await self.update_settings(project_id, settings)

        return await self.get_by_id(project_id)

    async def archive(self, project_id: str) -> Optional[Project]:
        """Archive a project without deleting it permanently."""
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        await self.db_client.execute(
            """
            UPDATE Project
            SET archivedAt = ?, isDefault = 0
            WHERE id = ? AND deletedAt IS NULL
            """,
            [now, project_id],
        )
        return await self.get_by_id(project_id)

    async def unarchive(self, project_id: str) -> Optional[Project]:
        """Unarchive a project if it is not deleted."""
        self._ensure_connected()
        await self.db_client.execute(
            """
            UPDATE Project
            SET archivedAt = NULL
            WHERE id = ? AND deletedAt IS NULL
            """,
            [project_id],
        )
        return await self.get_by_id(project_id)

    async def hard_delete(self, project_id: str) -> bool:
        """Mark a project as deleted (reserved hard-delete path)."""
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        await self.db_client.execute(
            """
            UPDATE Project
            SET deletedAt = ?, isDefault = 0
            WHERE id = ?
            """,
            [now, project_id],
        )
        return True

    async def delete(self, project_id: str) -> bool:
        """
        Backwards-compatible alias for hard delete.

        Args:
            project_id: Project ID

        Returns:
            True if deleted
        """
        self._ensure_connected()

        return await self.hard_delete(project_id)

    async def get_by_url(self, user_id: str, url: str) -> Optional[Project]:
        """
        Get project by GitHub URL for a user.

        Args:
            user_id: User ID
            url: GitHub repository URL

        Returns:
            Project if found
        """
        self._ensure_connected()

        rs = await self.db_client.execute(
            """
            SELECT id, userId, name, url, type, description, isDefault, settings,
                   lastAnalyzedAt, archivedAt, deletedAt, createdAt
            FROM Project
            WHERE userId = ? AND url = ? AND deletedAt IS NULL
            LIMIT 1
            """,
            [user_id, url]
        )

        if rs.rows:
            return self._row_to_project(rs.rows[0])
        return None

    async def get_first_active_by_user(self, user_id: str) -> Optional[Project]:
        """Return the first non-archived, non-deleted project for fallback flows."""
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, name, url, type, description, isDefault, settings,
                   lastAnalyzedAt, archivedAt, deletedAt, createdAt
            FROM Project
            WHERE userId = ? AND archivedAt IS NULL AND deletedAt IS NULL
            ORDER BY createdAt DESC
            LIMIT 1
            """,
            [user_id],
        )
        if rs.rows:
            return self._row_to_project(rs.rows[0])
        return None


# Global store instance
project_store = ProjectStore()
