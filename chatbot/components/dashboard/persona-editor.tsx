"use client";

import { Loader2, Plus, Trash2, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePersonas, type CustomerPersona } from "@/hooks/use-personas";

interface PersonaEditorProps {
	projectId?: string;
}

function TagInput({
	label,
	items,
	onChange,
	placeholder,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	placeholder?: string;
}) {
	const [value, setValue] = useState("");

	const add = () => {
		if (value.trim()) {
			onChange([...items, value.trim()]);
			setValue("");
		}
	};

	return (
		<div>
			<label className="mb-1 block text-xs font-medium text-muted-foreground">
				{label}
			</label>
			<div className="flex flex-wrap gap-1 mb-1.5">
				{items.map((item, i) => (
					<Badge key={i} variant="secondary" className="text-xs gap-1">
						{item}
						<button
							type="button"
							onClick={() => onChange(items.filter((_, j) => j !== i))}
							className="hover:text-destructive"
						>
							<X className="h-2.5 w-2.5" />
						</button>
					</Badge>
				))}
			</div>
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={placeholder || `Add ${label.toLowerCase()}...`}
				className="h-7 text-xs"
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						add();
					}
				}}
			/>
		</div>
	);
}

function PersonaCard({
	persona,
	onEdit,
	onDelete,
}: {
	persona: CustomerPersona;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div
			className="group cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
			onClick={onEdit}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onEdit();
				}
			}}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center justify-between mb-1.5">
				<div className="flex items-center gap-2">
					<span className="text-base">{persona.avatar || "👤"}</span>
					<span className="font-medium text-sm">{persona.name}</span>
				</div>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>

			{persona.demographics?.role && (
				<p className="text-xs text-muted-foreground mb-1">
					{persona.demographics.role}
					{persona.demographics.industry ? ` · ${persona.demographics.industry}` : ""}
				</p>
			)}

			{persona.painPoints && persona.painPoints.length > 0 && (
				<div className="flex flex-wrap gap-1 mt-1.5">
					{persona.painPoints.slice(0, 3).map((p, i) => (
						<Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
							{p}
						</Badge>
					))}
					{persona.painPoints.length > 3 && (
						<span className="text-[10px] text-muted-foreground">
							+{persona.painPoints.length - 3}
						</span>
					)}
				</div>
			)}

			{/* Confidence indicator */}
			<div className="mt-2 flex items-center gap-1.5">
				<div className="h-1 flex-1 rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${persona.confidence ?? 50}%` }}
					/>
				</div>
				<span className="text-[10px] text-muted-foreground">
					{persona.confidence ?? 50}%
				</span>
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
			<div className="flex items-center gap-2 py-4">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-xs text-muted-foreground">Loading personas...</span>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold">Audience Personas</h3>
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs"
					onClick={() => { resetForm(); setShowForm(true); }}
				>
					<Plus className="mr-1 h-3 w-3" />
					Add
				</Button>
			</div>

			{/* Persona cards */}
			{personas.length > 0 && (
				<div className="grid gap-2">
					{personas.map((p) => (
						<PersonaCard
							key={p.id}
							persona={p}
							onEdit={() => editPersona(p)}
							onDelete={() => removePersona(p.id)}
						/>
					))}
				</div>
			)}

			{/* Empty state */}
			{personas.length === 0 && !showForm && (
				<div className="rounded-lg border border-dashed p-4 text-center">
					<UserCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						Who are you creating for? Add your first audience persona to start building the bridge.
					</p>
					<Button
						size="sm"
						variant="ghost"
						className="mt-2 text-xs"
						onClick={() => setShowForm(true)}
					>
						<Plus className="mr-1 h-3 w-3" />
						Create first persona
					</Button>
				</div>
			)}

			{/* Create/Edit form */}
			{showForm && (
				<div className="rounded-lg border p-3 space-y-3">
					<h4 className="text-xs font-medium">
						{editingId ? "Edit Persona" : "New Persona"}
					</h4>

					<div className="grid gap-2 grid-cols-[auto_1fr]">
						<Input
							value={form.avatar}
							onChange={(e) => setForm({ ...form, avatar: e.target.value })}
							placeholder="👤"
							className="h-8 w-12 text-center text-sm"
						/>
						<Input
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="Persona name"
							className="h-8 text-sm"
						/>
					</div>

					<div className="grid gap-2 grid-cols-2">
						<Input
							value={form.role}
							onChange={(e) => setForm({ ...form, role: e.target.value })}
							placeholder="Role (CTO, Marketer...)"
							className="h-7 text-xs"
						/>
						<Input
							value={form.industry}
							onChange={(e) => setForm({ ...form, industry: e.target.value })}
							placeholder="Industry"
							className="h-7 text-xs"
						/>
					</div>

					<TagInput
						label="Pain Points"
						items={form.painPoints}
						onChange={(items) => setForm({ ...form, painPoints: items })}
						placeholder="What keeps them up at night?"
					/>

					<TagInput
						label="Goals"
						items={form.goals}
						onChange={(items) => setForm({ ...form, goals: items })}
						placeholder="What are they trying to achieve?"
					/>

					<TagInput
						label="Language Triggers"
						items={form.triggers}
						onChange={(items) => setForm({ ...form, triggers: items })}
						placeholder="Words that resonate"
					/>

					<TagInput
						label="Objections"
						items={form.objections}
						onChange={(items) => setForm({ ...form, objections: items })}
						placeholder="Why they hesitate"
					/>

					<div className="flex gap-2 pt-1">
						<Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!form.name.trim() || saving}>
							{saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
							{editingId ? "Update" : "Create"}
						</Button>
						<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetForm}>
							Cancel
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
