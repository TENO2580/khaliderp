"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Globe, Loader2, MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SwotMatrix from "@/components/intelligence/SwotMatrix";

export default function IntelligenceReport() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/intelligence/reports/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        toast.error("Failed to load report data");
        router.push('/dashboard/intelligence');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="p-8">No data found</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/intelligence">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{data.name}</h2>
          <div className="flex items-center text-muted-foreground mt-1 space-x-4">
            {data.website && <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> {data.website}</span>}
            {data.country && <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {data.country}</span>}
            {data.industry && <Badge variant="secondary">{data.industry}</Badge>}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="products">Products ({data.products?.length || 0})</TabsTrigger>
          <TabsTrigger value="marketing">Marketing & Customer</TabsTrigger>
          <TabsTrigger value="competitors">Competitors ({data.competitors?.length || 0})</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Strategy & Gaps</TabsTrigger>
          <TabsTrigger value="seo">SEO & Tech</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.overview || "No overview available."}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Business Model</h4>
                    <p className="text-sm text-muted-foreground">{data.businessModel || "Unknown"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Target Customers</h4>
                    <p className="text-sm text-muted-foreground">{data.targetCustomers || "Unknown"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Estimated Size</h4>
                    <p className="text-sm text-muted-foreground">{data.estimatedSize || "Unknown"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Market Position</h4>
                    <p className="text-sm text-muted-foreground">{data.marketPosition || "Unknown"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fast Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                    <h4 className="font-semibold text-sm">Status</h4>
                    <Badge variant={data.status === 'COMPLETED' ? 'default' : 'secondary'}>{data.status}</Badge>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm">Last Crawled</h4>
                    <p className="text-sm text-muted-foreground">{new Date(data.updatedAt).toLocaleString()}</p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial & Organizational Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border p-4 rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Est. Revenue</h4>
                  <p className="text-xl font-bold">{data.revenueRange || "Unknown"}</p>
                </div>
                <div className="border p-4 rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Employees</h4>
                  <p className="text-xl font-bold">{data.employeesCount || "Unknown"}</p>
                </div>
                <div className="border p-4 rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Funding</h4>
                  <p className="text-xl font-bold">{data.fundingNews || "No recent news"}</p>
                </div>
                <div className="border p-4 rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Acquisitions</h4>
                  <p className="text-xl font-bold">{data.acquisitions || "None detected"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Identified Products & Services</CardTitle>
              <CardDescription>Extracted from the company's website.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.products && data.products.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.products.map((p: any) => (
                    <div key={p.id} className="border p-4 rounded-lg">
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                      {p.features && <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{p.features}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No products extracted.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identified Competitors</CardTitle>
              <CardDescription>Competitors extracted from intelligence gathering.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.competitors && data.competitors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.competitors.map((c: any) => (
                    <div key={c.id} className="border p-4 rounded-lg">
                      <h4 className="font-semibold">{c.name}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{c.website}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No direct competitors identified.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                {data.marketing ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">Campaigns</h4>
                      <p className="text-sm text-muted-foreground">{data.marketing.campaigns ? JSON.parse(data.marketing.campaigns).join(', ') : "None"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Lead Magnets</h4>
                      <p className="text-sm text-muted-foreground">{data.marketing.leadMagnets ? JSON.parse(data.marketing.leadMagnets).join(', ') : "None"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Content Frequency</h4>
                      <p className="text-sm text-muted-foreground">{data.marketing.contentFreq}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Marketing intelligence not available.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Customer Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                {data.customer ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">Sentiment Score</h4>
                      <p className="text-xl font-bold text-blue-500">{data.customer.sentimentScore}/100</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Top Compliments</h4>
                      <p className="text-sm text-muted-foreground">{data.customer.topCompliments ? JSON.parse(data.customer.topCompliments).join(', ') : "None"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-red-500">Top Complaints</h4>
                      <p className="text-sm text-muted-foreground">{data.customer.topComplaints ? JSON.parse(data.customer.topComplaints).join(', ') : "None"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Customer intelligence not available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="swot">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated SWOT Analysis</CardTitle>
              <CardDescription>Strengths, Weaknesses, Opportunities, and Threats generated based on scraped data.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.swot ? (
                <SwotMatrix data={data.swot} />
              ) : (
                <p className="text-sm text-muted-foreground">SWOT Analysis not available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gap Analysis (vs Our ERP)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.gapAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">Missing Features</h4>
                      <p className="text-sm text-muted-foreground">{data.gapAnalysis.missingFeatures ? JSON.parse(data.gapAnalysis.missingFeatures).join(', ') : "None"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Marketing Gaps</h4>
                      <p className="text-sm text-muted-foreground">{data.gapAnalysis.marketingGaps}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-green-500">Recommendations for Us</h4>
                      <p className="text-sm text-muted-foreground">{data.gapAnalysis.recommendations ? JSON.parse(data.gapAnalysis.recommendations).join(', ') : "None"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Gap analysis not available.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Strategic Playbook</CardTitle>
              </CardHeader>
              <CardContent>
                {data.strategies && data.strategies.length > 0 ? (
                  <div className="space-y-4">
                    {data.strategies.map((strat: any) => (
                      <div key={strat.id} className="border p-4 rounded-lg">
                        <h4 className="font-semibold text-sm capitalize">{strat.type.toLowerCase()} Strategy</h4>
                        <p className="text-sm text-muted-foreground mt-1">{strat.strategy}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI strategies generated.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SEO Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.seoAnalysis ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-sm">Meta Title</h4>
                      <p className="text-sm text-muted-foreground">{data.seoAnalysis.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Meta Description</h4>
                      <p className="text-sm text-muted-foreground">{data.seoAnalysis.metaDescription}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-semibold text-sm">H1 Tags</h4>
                        <p className="text-sm text-muted-foreground">{data.seoAnalysis.h1Count}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Internal Links</h4>
                        <p className="text-sm text-muted-foreground">{data.seoAnalysis.internalLinks}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Schema.org</h4>
                        <Badge variant={data.seoAnalysis.schemaPresent ? "default" : "destructive"}>
                          {data.seoAnalysis.schemaPresent ? "Present" : "Missing"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">SEO Score</h4>
                        <p className="text-xl font-bold text-green-500">{data.seoAnalysis.score}/100</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">SEO data not available.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                {data.techStack && data.techStack.length > 0 ? (
                  <div className="space-y-4">
                    {data.techStack.map((tech: any) => (
                      <div key={tech.id} className="flex justify-between items-center border-b pb-2">
                        <span className="font-semibold">{tech.category}</span>
                        <span className="text-muted-foreground">{tech.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No technology stack detected.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
