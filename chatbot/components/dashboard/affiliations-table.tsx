"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Edit, ExternalLink, Loader2, LogIn, Mail, MoreHorizontal, Search, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AffiliateLink } from "@/lib/db/schema";

interface AffiliationsTableProps {
	affiliations: AffiliateLink[];
	onEdit: (affiliation: AffiliateLink) => void;
	onDelete: (id: string) => void;
	onResearch: (affiliation: AffiliateLink) => void;
	researchingId: string | null;
}

function getStatusColor(status: string) {
	switch (status) {
		case "active":
			return "bg-green-100 text-green-800";
		case "paused":
			return "bg-yellow-100 text-yellow-800";
		case "expired":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

export function AffiliationsTable({
	affiliations,
	onEdit,
	onDelete,
	onResearch,
	researchingId,
}: AffiliationsTableProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	if (affiliations.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<p>No affiliate links yet.</p>
				<p className="text-sm">Add your first affiliate link to get started.</p>
			</div>
		);
	}

	return (
		<>
			{/* Mobile Card View */}
			<div className="space-y-3 sm:hidden">
				{affiliations.map((affiliation) => (
					<div key={affiliation.id} className="border rounded-lg p-3 space-y-2">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="font-medium text-sm truncate">{affiliation.name}</span>
									<a
										href={affiliation.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-muted-foreground hover:text-foreground shrink-0"
									>
										<ExternalLink className="h-3 w-3" />
									</a>
									{affiliation.loginUrl && (
										<a
											href={affiliation.loginUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-foreground shrink-0"
											title="Dashboard"
										>
											<LogIn className="h-3 w-3" />
										</a>
									)}
									{affiliation.contactUrl && (
										<a
											href={affiliation.contactUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-foreground shrink-0"
											title="Contact"
										>
											<Mail className="h-3 w-3" />
										</a>
									)}
								</div>
								{affiliation.description && (
									<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{affiliation.description}</p>
								)}
								{affiliation.category && (
									<Badge variant="outline" className="mt-1 text-xs">{affiliation.category}</Badge>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Badge className={`text-xs ${getStatusColor(affiliation.status)}`}>
									{affiliation.status}
								</Badge>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onResearch(affiliation)}>
											<Search className="mr-2 h-4 w-4" />
											Research
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onEdit(affiliation)}>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => onDelete(affiliation.id)}
											className="text-red-600"
										>
											<Trash className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2 text-xs">
							<div>
								<p className="text-muted-foreground">Commission</p>
								<p className="font-medium">{affiliation.commission || "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Expires</p>
								<p className="font-medium">
									{affiliation.expiresAt
										? new Date(affiliation.expiresAt).toLocaleDateString()
										: "-"}
								</p>
							</div>
						</div>
						{affiliation.keywords && affiliation.keywords.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{affiliation.keywords.slice(0, 3).map((keyword) => (
									<Badge key={keyword} variant="secondary" className="text-xs">
										{keyword}
									</Badge>
								))}
								{affiliation.keywords.length > 3 && (
									<Badge variant="secondary" className="text-xs">
										+{affiliation.keywords.length - 3}
									</Badge>
								)}
							</div>
						)}
						{researchingId === affiliation.id && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
								<Loader2 className="h-3 w-3 animate-spin" />
								Researching...
							</div>
						)}
						{affiliation.researchSummary && (
							<div className="pt-1">
								<button
									type="button"
									onClick={() => setExpandedId(expandedId === affiliation.id ? null : affiliation.id)}
									className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
								>
									{expandedId === affiliation.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
									Research {affiliation.researchedAt && `(${new Date(affiliation.researchedAt).toLocaleDateString()})`}
								</button>
								{expandedId === affiliation.id && (
									<div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap border-t pt-2">
										{affiliation.researchSummary}
									</div>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Desktop Table View */}
			<div className="hidden sm:block overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b text-left text-sm text-muted-foreground">
							<th className="pb-3 font-medium">Name</th>
							<th className="pb-3 font-medium">Category</th>
							<th className="pb-3 font-medium">Commission</th>
							<th className="pb-3 font-medium">Keywords</th>
							<th className="pb-3 font-medium">Status</th>
							<th className="pb-3 font-medium">Expires</th>
							<th className="pb-3 font-medium text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{affiliations.map((affiliation) => (
							<Fragment key={affiliation.id}>
							<tr className="border-b">
								<td className="py-4">
									<div className="flex items-center gap-2">
										<span className="font-medium">{affiliation.name}</span>
										<a
											href={affiliation.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-foreground"
											title="Website"
										>
											<ExternalLink className="h-3 w-3" />
										</a>
										{affiliation.loginUrl && (
											<a
												href={affiliation.loginUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground hover:text-foreground"
												title="Dashboard"
											>
												<LogIn className="h-3 w-3" />
											</a>
										)}
										{affiliation.contactUrl && (
											<a
												href={affiliation.contactUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground hover:text-foreground"
												title="Contact"
											>
												<Mail className="h-3 w-3" />
											</a>
										)}
									</div>
									{affiliation.description && (
										<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{affiliation.description}</p>
									)}
								</td>
								<td className="py-4">
									{affiliation.category ? (
										<Badge variant="outline">{affiliation.category}</Badge>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</td>
								<td className="py-4">
									{affiliation.commission || (
										<span className="text-muted-foreground">-</span>
									)}
								</td>
								<td className="py-4">
									<div className="flex flex-wrap gap-1">
										{affiliation.keywords?.slice(0, 3).map((keyword) => (
											<Badge key={keyword} variant="secondary" className="text-xs">
												{keyword}
											</Badge>
										))}
										{affiliation.keywords && affiliation.keywords.length > 3 && (
											<Badge variant="secondary" className="text-xs">
												+{affiliation.keywords.length - 3}
											</Badge>
										)}
										{!affiliation.keywords?.length && (
											<span className="text-muted-foreground">-</span>
										)}
									</div>
								</td>
								<td className="py-4">
									<Badge className={getStatusColor(affiliation.status)}>
										{affiliation.status}
									</Badge>
								</td>
								<td className="py-4">
									{affiliation.expiresAt ? (
										<span className="text-sm">
											{new Date(affiliation.expiresAt).toLocaleDateString()}
										</span>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</td>
								<td className="py-4 text-right">
									<div className="flex items-center justify-end gap-1">
										{researchingId === affiliation.id && (
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										)}
										{affiliation.researchSummary && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setExpandedId(expandedId === affiliation.id ? null : affiliation.id)}
												title={`Research (${affiliation.researchedAt ? new Date(affiliation.researchedAt).toLocaleDateString() : ""})`}
											>
												{expandedId === affiliation.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
											</Button>
										)}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => onResearch(affiliation)}>
													<Search className="mr-2 h-4 w-4" />
													{affiliation.researchSummary ? "Re-research" : "Research"}
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => onEdit(affiliation)}>
													<Edit className="mr-2 h-4 w-4" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => onDelete(affiliation.id)}
													className="text-red-600"
												>
													<Trash className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</td>
							</tr>
							{expandedId === affiliation.id && affiliation.researchSummary && (
								<tr className="border-b bg-muted/30">
									<td colSpan={7} className="px-4 py-3">
										<div className="text-sm">
											<div className="flex items-center justify-between mb-2">
												<span className="font-medium text-xs text-muted-foreground">
													Research Summary {affiliation.researchedAt && `- ${new Date(affiliation.researchedAt).toLocaleDateString()}`}
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="text-xs h-6"
													onClick={() => onResearch(affiliation)}
													disabled={researchingId === affiliation.id}
												>
													{researchingId === affiliation.id ? (
														<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Updating...</>
													) : (
														<><Search className="mr-1 h-3 w-3" /> Update</>
													)}
												</Button>
											</div>
											<div className="whitespace-pre-wrap text-xs leading-relaxed">
												{affiliation.researchSummary}
											</div>
										</div>
									</td>
								</tr>
							)}
							</Fragment>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
}
