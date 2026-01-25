"""
GitHub Repository Analyzer for SEO Agents
Clone, analyze, and sync target website repositories
"""
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import subprocess
import os
import json
import re
from datetime import datetime
from collections import defaultdict


class GitHubRepoAnalyzer:
    """
    Analyze GitHub repositories for website structure and content.
    Clones repos locally and extracts SEO-relevant information.
    """
    
    def __init__(self, workspace_dir: Optional[str] = None):
        """
        Initialize analyzer with workspace directory.
        
        Args:
            workspace_dir: Directory to clone repos into (default: ./data/repos)
        """
        if workspace_dir:
            self.workspace = Path(workspace_dir)
        else:
            # Use data/repos in project root
            project_root = self._find_project_root()
            self.workspace = project_root / "data" / "repos"
        
        self.workspace.mkdir(parents=True, exist_ok=True)
        print(f"📁 Workspace: {self.workspace}")
    
    def _find_project_root(self) -> Path:
        """Find project root (where .git exists)."""
        current = Path.cwd()
        while current != current.parent:
            if (current / ".git").exists():
                return current
            current = current.parent
        return Path.cwd()
    
    def clone_or_update_repo(
        self,
        repo_url: str,
        force_update: bool = True
    ) -> Path:
        """
        Clone repository or update if already exists.
        
        Args:
            repo_url: GitHub repository URL (https or git)
            force_update: Always fetch latest changes (default: True)
            
        Returns:
            Path to cloned repository
        """
        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').split('/')[-1]
        if repo_name.endswith('.git'):
            repo_name = repo_name[:-4]
        
        repo_path = self.workspace / repo_name
        
        # Clone if doesn't exist
        if not repo_path.exists():
            print(f"📥 Cloning {repo_name}...")
            try:
                subprocess.run(
                    ["git", "clone", repo_url, str(repo_path)],
                    check=True,
                    capture_output=True,
                    text=True
                )
                print(f"✅ Cloned to: {repo_path}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Clone failed: {e.stderr}")
                raise
        
        # Update if force_update
        elif force_update:
            print(f"🔄 Updating {repo_name}...")
            try:
                os.chdir(repo_path)
                
                # Fetch latest changes
                subprocess.run(
                    ["git", "fetch", "origin"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                # Get current branch
                branch_result = subprocess.run(
                    ["git", "branch", "--show-current"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                branch = branch_result.stdout.strip() or "master"
                
                # Pull latest
                subprocess.run(
                    ["git", "pull", "origin", branch],
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                print(f"✅ Updated to latest ({branch})")
            except subprocess.CalledProcessError as e:
                print(f"⚠️ Update failed: {e.stderr}")
                print(f"   Continuing with existing version...")
        else:
            print(f"📂 Using existing repo: {repo_path}")
        
        return repo_path
    
    def analyze_site_structure(self, repo_path: Path) -> Dict[str, Any]:
        """
        Analyze website structure and configuration.
        
        Args:
            repo_path: Path to cloned repository
            
        Returns:
            Dictionary with site structure information
        """
        print(f"\n🔍 Analyzing site structure...")
        
        structure = {
            "repo_path": str(repo_path),
            "site_type": None,
            "config_files": [],
            "content_directories": [],
            "framework": None,
            "total_files": 0,
            "content_stats": {}
        }
        
        # Detect framework and config
        if (repo_path / "astro.config.mjs").exists():
            structure["framework"] = "Astro"
            structure["config_files"].append("astro.config.mjs")
        elif (repo_path / "astro.config.js").exists():
            structure["framework"] = "Astro"
            structure["config_files"].append("astro.config.js")
        elif (repo_path / "next.config.js").exists():
            structure["framework"] = "Next.js"
            structure["config_files"].append("next.config.js")
        elif (repo_path / "gatsby-config.js").exists():
            structure["framework"] = "Gatsby"
            structure["config_files"].append("gatsby-config.js")
        elif (repo_path / "package.json").exists():
            # Try to detect from package.json
            try:
                with open(repo_path / "package.json") as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    if "astro" in deps:
                        structure["framework"] = "Astro"
                    elif "next" in deps:
                        structure["framework"] = "Next.js"
                    elif "gatsby" in deps:
                        structure["framework"] = "Gatsby"
            except:
                pass
        
        # Find common content directories
        common_content_dirs = [
            "src/pages", "src/content", "content", "pages",
            "blog", "posts", "articles", "docs"
        ]
        
        for dir_name in common_content_dirs:
            dir_path = repo_path / dir_name
            if dir_path.exists() and dir_path.is_dir():
                structure["content_directories"].append(dir_name)
        
        # Count files
        all_files = list(repo_path.rglob("*"))
        structure["total_files"] = len([f for f in all_files if f.is_file()])
        
        print(f"✅ Framework: {structure['framework'] or 'Unknown'}")
        print(f"✅ Content dirs: {', '.join(structure['content_directories'])}")
        
        return structure
    
    def find_all_content_files(
        self,
        repo_path: Path,
        extensions: Optional[List[str]] = None,
        max_files: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Find all content files (markdown, MDX, etc).

        Args:
            repo_path: Path to repository
            extensions: File extensions to search (default: ['.md', '.mdx', '.astro'])
            max_files: Maximum number of files to analyze (default: 100)

        Returns:
            List of content files with metadata
        """
        if extensions is None:
            extensions = ['.md', '.mdx', '.astro']

        print(f"\n📄 Finding content files (max {max_files})...")

        content_files = []

        # Exclude common non-content directories
        exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', '.astro'}

        # Priority directories to check first
        priority_dirs = ['src/content', 'content', 'blog', 'docs', 'pages']

        # First, collect from priority directories
        for priority_dir in priority_dirs:
            dir_path = repo_path / priority_dir
            if dir_path.exists():
                for ext in extensions:
                    for file_path in dir_path.rglob(f"*{ext}"):
                        if len(content_files) >= max_files:
                            break
                        # Skip if in excluded directory
                        if any(excluded in file_path.parts for excluded in exclude_dirs):
                            continue

                        # Get relative path
                        rel_path = file_path.relative_to(repo_path)

                        # Extract basic info
                        file_info = {
                            "path": str(rel_path),
                            "filename": file_path.name,
                            "extension": ext,
                            "size_kb": file_path.stat().st_size / 1024,
                            "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                        }

                        # Try to extract frontmatter
                        try:
                            frontmatter = self._extract_frontmatter(file_path)
                            if frontmatter:
                                file_info["frontmatter"] = frontmatter
                        except:
                            pass

                        content_files.append(file_info)

        # If we still need more files, search the rest of the repo
        if len(content_files) < max_files:
            for ext in extensions:
                for file_path in repo_path.rglob(f"*{ext}"):
                    if len(content_files) >= max_files:
                        break
                    # Skip if in excluded directory
                    if any(excluded in file_path.parts for excluded in exclude_dirs):
                        continue

                    # Skip if already in priority directories
                    rel_path = file_path.relative_to(repo_path)
                    if any(str(rel_path).startswith(p + '/') for p in priority_dirs):
                        continue

                    # Get relative path
                    rel_path = file_path.relative_to(repo_path)

                    # Extract basic info
                    file_info = {
                        "path": str(rel_path),
                        "filename": file_path.name,
                        "extension": ext,
                        "size_kb": file_path.stat().st_size / 1024,
                        "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    }

                    # Try to extract frontmatter
                    try:
                        frontmatter = self._extract_frontmatter(file_path)
                        if frontmatter:
                            file_info["frontmatter"] = frontmatter
                    except:
                        pass

                    content_files.append(file_info)

        print(f"✅ Found {len(content_files)} content files")

        return content_files
    
    def _extract_frontmatter(self, file_path: Path) -> Optional[Dict[str, str]]:
        """Extract YAML frontmatter from file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for frontmatter
            if not content.startswith('---'):
                return None
            
            # Extract frontmatter block
            parts = content.split('---', 2)
            if len(parts) < 3:
                return None
            
            frontmatter_text = parts[1].strip()
            
            # Simple key-value parser (not full YAML)
            frontmatter = {}
            for line in frontmatter_text.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    frontmatter[key] = value
            
            return frontmatter
        except:
            return None
    
    def extract_metadata(self, repo_path: Path) -> Dict[str, Any]:
        """
        Extract comprehensive metadata from repository.
        
        Args:
            repo_path: Path to repository
            
        Returns:
            Metadata including SEO info, structure, content stats
        """
        print(f"\n📊 Extracting metadata...")
        
        metadata = {
            "extracted_at": datetime.now().isoformat(),
            "structure": self.analyze_site_structure(repo_path),
            "content_files": self.find_all_content_files(repo_path),
            "seo_data": {},
            "internal_links": {}
        }
        
        # Analyze SEO data from content files
        all_titles = []
        all_descriptions = []
        all_keywords = []
        
        for file_info in metadata["content_files"]:
            fm = file_info.get("frontmatter", {})
            if "title" in fm:
                all_titles.append(fm["title"])
            if "description" in fm:
                all_descriptions.append(fm["description"])
            if "keywords" in fm:
                all_keywords.append(fm["keywords"])
        
        metadata["seo_data"] = {
            "total_pages": len(metadata["content_files"]),
            "pages_with_titles": len(all_titles),
            "pages_with_descriptions": len(all_descriptions),
            "pages_with_keywords": len(all_keywords),
            "unique_titles": len(set(all_titles)),
            "avg_title_length": sum(len(t) for t in all_titles) / len(all_titles) if all_titles else 0
        }
        
        print(f"✅ Extracted metadata for {metadata['seo_data']['total_pages']} pages")
        
        return metadata
    
    def map_internal_links(
        self,
        repo_path: Path,
        content_files: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Map internal linking structure.
        
        Args:
            repo_path: Path to repository
            content_files: Pre-computed content files list
            
        Returns:
            Internal linking graph and statistics
        """
        print(f"\n🔗 Mapping internal links...")
        
        if content_files is None:
            content_files = self.find_all_content_files(repo_path)
        
        link_map = {
            "total_links": 0,
            "pages_analyzed": len(content_files),
            "links_by_page": {},
            "incoming_links": defaultdict(int),
            "orphan_pages": []
        }
        
        # Simple markdown link pattern
        link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
        
        for file_info in content_files:
            file_path = repo_path / file_info["path"]
            page_links = []
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find all markdown links
                for match in link_pattern.finditer(content):
                    link_text = match.group(1)
                    link_url = match.group(2)
                    
                    # Filter internal links (relative or same domain)
                    if not link_url.startswith(('http://', 'https://', 'mailto:', '#')):
                        page_links.append({
                            "text": link_text,
                            "url": link_url
                        })
                        link_map["incoming_links"][link_url] += 1
                        link_map["total_links"] += 1
            
            except:
                pass
            
            link_map["links_by_page"][file_info["path"]] = page_links
        
        # Find orphan pages (no incoming links)
        for file_info in content_files:
            path = file_info["path"]
            # Convert to URL-like path
            url_path = '/' + path.replace('\\', '/').replace('.md', '').replace('index', '')
            if link_map["incoming_links"].get(url_path, 0) == 0:
                link_map["orphan_pages"].append(path)
        
        print(f"✅ Found {link_map['total_links']} internal links")
        print(f"⚠️ {len(link_map['orphan_pages'])} potential orphan pages")
        
        return link_map
    
    def get_content_gaps(
        self,
        repo_path: Path,
        target_topics: List[str]
    ) -> Dict[str, Any]:
        """
        Identify content gaps for target topics.
        
        Args:
            repo_path: Path to repository
            target_topics: Topics to check coverage for
            
        Returns:
            Gap analysis with missing topics
        """
        print(f"\n🎯 Analyzing content gaps...")
        
        content_files = self.find_all_content_files(repo_path)
        
        # Extract all content text (titles + descriptions + filenames)
        existing_content_text = []
        for file_info in content_files:
            existing_content_text.append(file_info["filename"].lower())
            fm = file_info.get("frontmatter", {})
            if "title" in fm:
                existing_content_text.append(fm["title"].lower())
            if "description" in fm:
                existing_content_text.append(fm["description"].lower())
        
        content_corpus = " ".join(existing_content_text)
        
        # Check topic coverage
        gaps = {
            "topics_analyzed": len(target_topics),
            "covered_topics": [],
            "missing_topics": [],
            "partial_coverage": []
        }
        
        for topic in target_topics:
            topic_lower = topic.lower()
            # Count mentions
            mentions = content_corpus.count(topic_lower)
            
            if mentions >= 3:
                gaps["covered_topics"].append({"topic": topic, "mentions": mentions})
            elif mentions > 0:
                gaps["partial_coverage"].append({"topic": topic, "mentions": mentions})
            else:
                gaps["missing_topics"].append(topic)
        
        print(f"✅ Coverage: {len(gaps['covered_topics'])}/{len(target_topics)} topics")
        print(f"⚠️ Missing: {len(gaps['missing_topics'])} topics")
        
        return gaps
    
    def generate_analysis_report(
        self,
        repo_url: str,
        target_topics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Complete analysis workflow: clone, analyze, report.
        
        Args:
            repo_url: GitHub repository URL
            target_topics: Optional topics for gap analysis
            
        Returns:
            Comprehensive analysis report
        """
        print(f"\n{'='*60}")
        print(f"🔍 REPOSITORY ANALYSIS")
        print(f"{'='*60}\n")
        print(f"Repository: {repo_url}")
        
        # Clone/update repo
        repo_path = self.clone_or_update_repo(repo_url)
        
        # Extract metadata
        metadata = self.extract_metadata(repo_path)
        
        # Map internal links
        link_map = self.map_internal_links(repo_path, metadata["content_files"])
        
        # Gap analysis if topics provided
        gaps = None
        if target_topics:
            gaps = self.get_content_gaps(repo_path, target_topics)
        
        # Build report
        report = {
            "repo_url": repo_url,
            "repo_path": str(repo_path),
            "analyzed_at": datetime.now().isoformat(),
            "structure": metadata["structure"],
            "seo_data": metadata["seo_data"],
            "internal_links": link_map,
            "content_files": metadata["content_files"],
            "content_gaps": gaps
        }
        
        print(f"\n{'='*60}")
        print(f"✅ ANALYSIS COMPLETE")
        print(f"{'='*60}\n")
        
        return report


# Convenience functions
def analyze_repo(
    repo_url: str,
    target_topics: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Quick function to analyze a GitHub repository.
    
    Args:
        repo_url: GitHub repository URL
        target_topics: Topics for gap analysis
        
    Returns:
        Analysis report
    """
    analyzer = GitHubRepoAnalyzer()
    return analyzer.generate_analysis_report(repo_url, target_topics)


def update_and_analyze(repo_url: str) -> Dict[str, Any]:
    """
    Update repo to latest and analyze.
    
    Args:
        repo_url: GitHub repository URL
        
    Returns:
        Fresh analysis report
    """
    analyzer = GitHubRepoAnalyzer()
    return analyzer.generate_analysis_report(repo_url)


if __name__ == "__main__":
    # Test analysis
    print("=== GitHub Repo Analyzer Test ===\n")
    
    # Example: Analyze this repo
    test_url = "https://github.com/dianedef/my-robots.git"
    
    report = analyze_repo(
        repo_url=test_url,
        target_topics=["seo", "automation", "content strategy"]
    )
    
    print("\n📋 SUMMARY:")
    print(f"Framework: {report['structure']['framework']}")
    print(f"Total pages: {report['seo_data']['total_pages']}")
    print(f"Internal links: {report['internal_links']['total_links']}")
    if report['content_gaps']:
        print(f"Content gaps: {len(report['content_gaps']['missing_topics'])} missing topics")
