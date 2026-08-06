"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building, Globe, MapPin, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

// Components (We assume a typical shadcn/ui setup exists here, but use basic styling to ensure it works)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function IntelligenceDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    country: ""
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/intelligence');
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (error) {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    const interval = setInterval(fetchCompanies, 5000); // Poll for status updates
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Submission failed");
      
      toast.success("Analysis started!");
      setIsDialogOpen(false);
      setFormData({ name: "", website: "", industry: "", country: "" });
      fetchCompanies();
    } catch (error) {
      toast.error("Failed to start analysis");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Competitor Intelligence</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" /> Analyze Company
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Analyze Competitor</DialogTitle>
                  <DialogDescription>
                    Enter the details of the company you want to analyze. Our AI crawler will gather intelligence automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Company Name *</Label>
                    <Input id="name" required className="col-span-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Decor Doors" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right">Website</Label>
                    <Input id="website" className="col-span-3" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="e.g. decordoors.com" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="industry" className="text-right">Industry</Label>
                    <Input id="industry" className="col-span-3" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="e.g. Manufacturing" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="country" className="text-right">Country</Label>
                    <Input id="country" className="col-span-3" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g. India" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Start Analysis
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors Tracked</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Crawls</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'CRAWLING').length}</div>
          </CardContent>
        </Card>
        {/* Placeholder cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products Found</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.reduce((acc, curr) => acc + (curr._count?.products || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 my-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search companies..." 
            className="pl-8" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map(company => (
            <Card key={company.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{company.name}</CardTitle>
                  <Badge variant={company.status === 'COMPLETED' ? 'default' : company.status === 'FAILED' ? 'destructive' : 'secondary'}>
                    {company.status}
                    {company.status === 'CRAWLING' && <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />}
                  </Badge>
                </div>
                <CardDescription className="flex items-center mt-2">
                  <Globe className="h-3 w-3 mr-1" />
                  {company.website || "No website"}
                </CardDescription>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {company.country || "Unknown Location"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {company.overview || (company.status === 'CRAWLING' ? "Analysis in progress. The crawler is currently scanning the web for information." : "No overview available.")}
                </p>
                {company.status === 'COMPLETED' && (
                  <div className="mt-4 flex gap-2 text-xs">
                    <Badge variant="outline">{company._count?.products || 0} Products</Badge>
                    <Badge variant="outline">{company.industry || "General"}</Badge>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Link href={`/dashboard/intelligence/reports/${company.id}`} className="w-full">
                  <Button variant="ghost" className="w-full justify-between" disabled={company.status === 'PENDING' || company.status === 'CRAWLING'}>
                    View Intelligence Report
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          
          {filteredCompanies.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No companies found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">You haven't tracked any competitors yet, or no matches found.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Analyze a Company
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
