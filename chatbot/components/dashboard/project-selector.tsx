"use client";

import {
	Check,
	FolderGit2,
	Globe,
	Loader2,
	Plus,
	Trash2,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ProjectSelectorProps {
	onProjectChange?: (project: Project | null) => void;
}

export function ProjectSelector({ onProjectChange }: ProjectSelectorProps) {
	const {
		projects,
		selectedProject,
		loading,
		createProject,
		deleteProject,
		selectProject,
	} = useProjectsContext();

	const [showNewDialog, setShowNewDialog] = useState(false);
	const [creating, setCreating] = useState(false);
	const [newProject, setNewProject] = useState({
		name: "",
		url: "",
		type: "github" as "github" | "website",
		description: "",
	});

	const handleSelect = (project: Project) => {
		selectProject(project);
		onProjectChange?.(project);
	};

	const handleCreate = async () => {
		if (!newProject.name || !newProject.url) return;

		setCreating(true);
		try {
			const created = await createProject({
				...newProject,
				isDefault: projects.length === 0,
			});
			selectProject(created);
			onProjectChange?.(created);
			setShowNewDialog(false);
			setNewProject({ name: "", url: "", type: "github", description: "" });
			toast({ type: "success", description: `Project "${created.name}" created` });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create project";
			toast({ type: "error", description: message });
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (e: React.MouseEvent, project: Project) => {
		e.stopPropagation();
		e.preventDefault();
		if (confirm(`Delete project "${project.name}"?`)) {
			await deleteProject(project.id);
		}
	};

	if (loading) {
		return (
			<Button variant="outline" disabled className="w-[200px] justify-start">
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				Loading...
			</Button>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="w-[200px] justify-start">
						{selectedProject ? (
							<span className="flex items-center gap-2 truncate">
								{selectedProject.type === "github" ? (
									<FolderGit2 className="h-4 w-4 shrink-0" />
								) : (
									<Globe className="h-4 w-4 shrink-0" />
								)}
								<span className="truncate">{selectedProject.name}</span>
							</span>
						) : (
							<span className="text-muted-foreground">Select project...</span>
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-[200px]">
					{projects.length === 0 ? (
						<div className="px-2 py-1.5 text-sm text-muted-foreground">
							No projects yet
						</div>
					) : (
						projects.map((project) => (
							<DropdownMenuItem
								key={project.id}
								onClick={() => handleSelect(project)}
								className="flex items-center justify-between"
							>
								<span className="flex items-center gap-2 truncate">
									{project.type === "github" ? (
										<FolderGit2 className="h-4 w-4 shrink-0" />
									) : (
										<Globe className="h-4 w-4 shrink-0" />
									)}
									<span className="truncate">{project.name}</span>
								</span>
								<span className="flex items-center gap-1">
									{selectedProject?.id === project.id && (
										<Check className="h-4 w-4" />
									)}
									<button
										onClick={(e) => handleDelete(e, project)}
										className="p-1 hover:text-destructive"
									>
										<Trash2 className="h-3 w-3" />
									</button>
								</span>
							</DropdownMenuItem>
						))
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setShowNewDialog(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Add new project
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Project</DialogTitle>
						<DialogDescription>
							Add a GitHub repository or website to analyze.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="My Website"
								value={newProject.name}
								onChange={(e) =>
									setNewProject((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="type">Type</Label>
							<Select
								value={newProject.type}
								onValueChange={(value: "github" | "website") =>
									setNewProject((prev) => ({ ...prev, type: value }))
								}
							>
								<SelectTrigger>
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
							<Label htmlFor="url">
								{newProject.type === "github" ? "Repository URL" : "Website URL"}
							</Label>
							<Input
								id="url"
								placeholder={
									newProject.type === "github"
										? "https://github.com/user/repo"
										: "https://example.com"
								}
								value={newProject.url}
								onChange={(e) =>
									setNewProject((prev) => ({ ...prev, url: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Description (optional)</Label>
							<Input
								id="description"
								placeholder="Brief description..."
								value={newProject.description}
								onChange={(e) =>
									setNewProject((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowNewDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!newProject.name || !newProject.url || creating}
						>
							{creating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
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
