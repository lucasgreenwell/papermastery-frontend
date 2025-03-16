import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { SearchIcon, RefreshCw, ExternalLink } from "lucide-react";
import { useResearchersRealtime, ResearcherData } from "../../hooks/useResearchersRealtime";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";

interface ResearchersListProps {
  limit?: number;
  onSelectResearcher?: (researcher: ResearcherData) => void;
}

export function ResearchersList({ limit = 10, onSelectResearcher }: ResearchersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { researchers, loading, error, lastUpdated } = useResearchersRealtime(limit);

  // Filter researchers based on search term
  const filteredResearchers = researchers.filter(
    (researcher) =>
      researcher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof researcher.affiliation === "string" &&
        researcher.affiliation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      researcher.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case "background_started":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">In Progress</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Researchers Database</CardTitle>
            <CardDescription>
              Live view of all researchers in the database
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {lastUpdated && (
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search researchers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // Force resubscription to trigger a refresh
              window.location.reload();
            }}
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
            Error loading researchers: {error}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredResearchers.length > 0 ? (
                filteredResearchers.map((researcher) => (
                  <TableRow key={researcher.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium" 
                      onClick={() => onSelectResearcher && onSelectResearcher(researcher)}
                    >
                      {researcher.name || "Unnamed"}
                    </TableCell>
                    <TableCell onClick={() => onSelectResearcher && onSelectResearcher(researcher)}>
                      {researcher.email || "N/A"}
                    </TableCell>
                    <TableCell onClick={() => onSelectResearcher && onSelectResearcher(researcher)}>
                      {typeof researcher.affiliation === "string"
                        ? researcher.affiliation
                        : researcher.affiliation?.institution || "N/A"}
                    </TableCell>
                    <TableCell onClick={() => onSelectResearcher && onSelectResearcher(researcher)}>
                      {getStatusBadge(researcher.status)}
                    </TableCell>
                    <TableCell onClick={() => onSelectResearcher && onSelectResearcher(researcher)}>
                      {formatDate(researcher.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectResearcher && onSelectResearcher(researcher)}
                        title="View details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchTerm
                      ? "No researchers found matching your search."
                      : "No researchers in database."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 