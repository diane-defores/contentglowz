"use client";

import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePersonas, type CustomerPersona } from "@/hooks/use-personas";

interface PersonaEditorProps {
	projectId?: string;
}

function DynamicList({
	label,
	items,
	onChange,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
}) {
	const [newItem, setNewItem] = useState("");

	return (
		<div>
			<label className="mb-1 block text-xs font-medium text-muted-foreground">
				{label}
			</label>
			<div className="space-y-1">
				{items.map((item, i) => (
					<div key={i} className="flex items-center gap-1">
						<span className="flex-1 rounded border px-2 py-1 text-xs">
							{item}
						</span>
						<button
							type="button"
							onClick={() => onChange(items.filter((_, j) => j !== i))}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					</div>
				))}
				<div className="flex gap-1">
					<Input
						value={newItem}
						onChange={(e) => setNewItem(e.target.value)}
						placeholder={`Add ${label.toLowerCase()}...`}
						className="h-7 text-xs"
						onKeyDown={(e) => {
							if (e.key === "Enter" && newItem.trim()) {
								onChange([...items, newItem.trim()]);
								setNewItem("");
							}
						}}
					/>
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2"
						onClick={() => {
							if (newItem.trim()) {
								onChange([...items, newItem.trim()]);
								setNewItem("");
							}
						}}
					>
						<Plus className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export function PersonaEditor({ projectId }: PersonaEditorProps) {
	const { personas, loading, saving, createPersona, updatePersona, removePersona } =
		usePersonas(projectId);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		name: "",
		avatar: "",
		role: "",
		industry: "",
		ageRange: "",
		painPoints: [] as string[],
		goals: [] as string[],
		triggers: [] as string[],
		objections: [] as string[],
	});

	const resetForm = () => {
		setForm({
			name: "", avatar: "", role: "", industry: "", ageRange: "",
			painPoints: [], goals: [], triggers: [], objections: [],
		});
		setShowForm(false);
		setEditingId(null);
	};

	const editPersona = (p: CustomerPersona) => {
		setForm({
			name: p.name,
			avatar: p.avatar || "",
			role: p.demographics?.role || "",
			industry: p.demographics?.industry || "",
			ageRange: p.demographics?.ageRange || "",
			painPoints: p.painPoints || [],
			goals: p.goals || [],
			triggers: p.language?.triggers || [],
			objections: p.language?.objections || [],
		});
		setEditingId(p.id);
		setShowForm(true);
	};

	const handleSave = async () => {
		const data = {
			name: form.name,
			avatar: form.avatar || null,
			demographics: {
				role: form.role || undefined,
				industry: form.industry || undefined,
				ageRange: form.ageRange || undefined,
			},
			painPoints: form.painPoints,
			goals: form.goals,
			language: {
				triggers: form.triggers,
				objections: form.objections,
			},
			confidence: null as number | null,
			projectId: projectId || null,
			contentPreferences: null as CustomerPersona["contentPreferences"],
		};

		if (editingId) {
			await updatePersona(editingId, data);
		} else {
			await createPersona(data);
		}
		resetForm();
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center gap-2">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="text-sm text-muted-foreground">Loading personas...</span>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					<h2 className="text-lg font-semibold">Customer Personas</h2>
				</div>
				<Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
					<Plus className="mr-1 h-4 w-4" />
					New Persona
				</Button>
			</div>

			{/* Persona cards */}
			{personas.length > 0 && (
				<div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
					{personas.map((p) => (
						<div
							key={p.id}
							className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
							onClick={() => editPersona(p)}
						>
							<div className="mb-2 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-lg">{p.avatar || "👤"}</span>
									<span className="font-medium text-sm">{p.name}</span>
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										removePersona(p.id);
									}}
									className="text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
							{p.demographics?.role && (
								<p className="text-xs text-muted-foreground">
									{p.demographics.role}
									{p.demographics.industry ? ` in ${p.demographics.industry}` : ""}
								</p>
							)}
							{p.painPoints && p.painPoints.length > 0 && (
								<p className="mt-1 text-xs text-muted-foreground">
									Pain: {p.painPoints.slice(0, 2).join(", ")}
									{p.painPoints.length > 2 ? ` +${p.painPoints.length - 2}` : ""}
								</p>
							)}
							<div className="mt-2 h-1.5 w-full rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-primary"
									style={{ width: `${p.confidence ?? 50}%` }}
								/>
							</div>
							<span className="text-xs text-muted-foreground">
								{p.confidence ?? 50}% confidence
							</span>
						</div>
					))}
				</div>
			)}

			{/* Create/Edit form */}
			{showForm && (
				<div className="rounded-lg border p-4">
					<h3 className="mb-3 text-sm font-medium">
						{editingId ? "Edit Persona" : "New Persona"}
					</h3>
					<div className="grid gap-3 md:grid-cols-2">
						<div>
							<label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
							<Input
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="e.g., Startup Steve"
								className="h-8 text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-muted-foreground">Avatar (emoji)</label>
							<Input
								value={form.avatar}
								onChange={(e) => setForm({ ...form, avatar: e.target.value })}
								placeholder="e.g., 🚀"
								className="h-8 text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
							<Input
								value={form.role}
								onChange={(e) => setForm({ ...form, role: e.target.value })}
								placeholder="e.g., CTO"
								className="h-8 text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-muted-foreground">Industry</label>
							<Input
								value={form.industry}
								onChange={(e) => setForm({ ...form, industry: e.target.value })}
								placeholder="e.g., SaaS"
								className="h-8 text-sm"
							/>
						</div>
					</div>

					<div className="mt-3 grid gap-3 md:grid-cols-2">
						<DynamicList
							label="Pain Points"
							items={form.painPoints}
							onChange={(items) => setForm({ ...form, painPoints: items })}
						/>
						<DynamicList
							label="Goals"
							items={form.goals}
							onChange={(items) => setForm({ ...form, goals: items })}
						/>
						<DynamicList
							label="Language Triggers"
							items={form.triggers}
							onChange={(items) => setForm({ ...form, triggers: items })}
						/>
						<DynamicList
							label="Objections"
							items={form.objections}
							onChange={(items) => setForm({ ...form, objections: items })}
						/>
					</div>

					<div className="mt-4 flex gap-2">
						<Button size="sm" onClick={handleSave} disabled={!form.name.trim() || saving}>
							{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
							{editingId ? "Update" : "Create"}
						</Button>
						<Button size="sm" variant="ghost" onClick={resetForm}>
							Cancel
						</Button>
					</div>
				</div>
			)}

			{personas.length === 0 && !showForm && (
				<p className="text-sm text-muted-foreground">
					No personas yet. Create one to start generating content angles.
				</p>
			)}
		</Card>
	);
}
