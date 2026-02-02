"use client";

import {
	Edit2,
	FolderGit2,
	Globe,
	Loader2,
	Plus,
	Star,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/toast";
import { type Project } from "@/hooks/use-projects";
import { useProjectsContext } from "@/contexts/projects-context";

export function SettingsProjectsTab() {
	const {
		projects,
		loading,
		createProject,
		updateProject,
		deleteProject,
	} = useProjectsContext();

	const [showNewDialog, setShowNewDialog] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		url: "",
		type: "github" as "github" | "website",
		description: "",
	});

	const resetForm = () => {
		setFormData({ name: "", url: "", type: "github", description: "" });
	};

	const handleOpenNewDialog = () => {
		resetForm();
		setShowNewDialog(true);
	};

	const handleOpenEditDialog = (project: Project) => {
		setFormData({
			name: project.name,
			url: project.url,
			type: project.type,
			description: project.description || "",
		});
		setEditingProject(project);
	};

	const handleCloseDialog = () => {
		setShowNewDialog(false);
		setEditingProject(null);
		resetForm();
	};

	const handleCreate = async () => {
		if (!formData.name || !formData.url) return;

		setSaving(true);
		try {
			await createProject({
				...formData,
				isDefault: projects.length === 0,
			});
			toast({ type: "success", description: `Project "${formData.name}" created` });
			handleCloseDialog();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create project";
			toast({ type: "error", description: message });
		} finally {
			setSaving(false);
		}
	};

	const handleUpdate = async () => {
		if (!editingProject || !formData.name || !formData.url) return;

		setSaving(true);
		try {
			await updateProject(editingProject.id, formData);
			toast({ type: "success", description: `Project "${formData.name}" updated` });
			handleCloseDialog();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to update project";
			toast({ type: "error", description: message });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (project: Project) => {
		if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
			return;
		}

		setDeletingId(project.id);
		try {
			await deleteProject(project.id);
			toast({ type: "success", description: `Project "${project.name}" deleted` });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to delete project";
			toast({ type: "error", description: message });
		} finally {
			setDeletingId(null);
		}
	};

	const handleSetDefault = async (project: Project) => {
		if (project.isDefault) return;

		try {
			await updateProject(project.id, { isDefault: true });
			toast({ type: "success", description: `"${project.name}" is now the default project` });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to set default project";
			toast({ type: "error", description: message });
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Manage your projects and set defaults.
					</p>
					<Button size="sm" onClick={handleOpenNewDialog}>
						<Plus className="mr-2 h-4 w-4" />
						Add Project
					</Button>
				</div>

				{projects.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
						<FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
						<p className="mt-2 text-sm text-muted-foreground">No projects yet</p>
						<Button
							variant="link"
							size="sm"
							className="mt-1"
							onClick={handleOpenNewDialog}
						>
							Add your first project
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						{projects.map((project) => (
							<div
								key={project.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex items-center gap-3 min-w-0">
									{project.type === "github" ? (
										<FolderGit2 className="h-5 w-5 shrink-0 text-muted-foreground" />
									) : (
										<Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
									)}
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium truncate">{project.name}</span>
											{project.isDefault && (
												<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
											)}
											<span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
												{project.type === "github" ? "GitHub" : "Website"}
											</span>
										</div>
										<a
											href={project.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-muted-foreground hover:underline truncate block"
										>
											{project.url}
										</a>
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									{!project.isDefault && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => handleSetDefault(project)}
											title="Set as default"
										>
											<Star className="h-4 w-4" />
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => handleOpenEditDialog(project)}
										title="Edit project"
									>
										<Edit2 className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										onClick={() => handleDelete(project)}
										disabled={deletingId === project.id}
										title="Delete project"
									>
										{deletingId === project.id ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Create/Edit Dialog */}
			<Dialog open={showNewDialog || !!editingProject} onOpenChange={handleCloseDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingProject ? "Edit Project" : "Add New Project"}
						</DialogTitle>
						<DialogDescription>
							{editingProject
								? "Update your project details."
								: "Add a GitHub repository or website to analyze."}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="project-name">Name</Label>
							<Input
								id="project-name"
								placeholder="My Website"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="project-type">Type</Label>
							<Select
								value={formData.type}
								onValueChange={(value: "github" | "website") =>
									setFormData((prev) => ({ ...prev, type: value }))
								}
							>
								<SelectTrigger id="project-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="github">
										<span className="flex items-center gap-2">
											<FolderGit2 className="h-4 w-4" />
											GitHub Repository
										</span>
									</SelectItem>
									<SelectItem value="website">
										<span className="flex items-center gap-2">
											<Globe className="h-4 w-4" />
											Website
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="project-url">
								{formData.type === "github" ? "Repository URL" : "Website URL"}
							</Label>
							<Input
								id="project-url"
								placeholder={
									formData.type === "github"
										? "https://github.com/user/repo"
										: "https://example.com"
								}
								value={formData.url}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, url: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="project-description">Description (optional)</Label>
							<Input
								id="project-description"
								placeholder="Brief description..."
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleCloseDialog}>
							Cancel
						</Button>
						<Button
							onClick={editingProject ? handleUpdate : handleCreate}
							disabled={!formData.name || !formData.url || saving}
						>
							{saving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{editingProject ? "Saving..." : "Creating..."}
								</>
							) : editingProject ? (
								"Save Changes"
							) : (
								"Create Project"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
