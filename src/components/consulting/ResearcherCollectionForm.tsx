import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { collectResearcherData } from "../../services/apiClient";
import { ResearcherDataDisplay } from "./ResearcherDataDisplay";
import { useResearcherRealtime } from "../../hooks/useResearcherRealtime";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Info, Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { supabase } from "../../integrations/supabase/client";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  affiliation: z.string().optional(),
  position: z.string().optional(),
  paper_title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  researcher_id: z.string().optional().or(z.literal(""))
});

type FormValues = z.infer<typeof formSchema>;

export type ResearcherCollectionFormProps = {
  defaultValues?: Partial<FormValues>;
};

export function ResearcherCollectionForm({ defaultValues = {} }: ResearcherCollectionFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [researcherId, setResearcherId] = useState<string | null>(null);
  const [formStarted, setFormStarted] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  
  // Use the realtime hook to get updates on researcher data
  const { researcher, loading, error: realtimeError, progress } = useResearcherRealtime(researcherId);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      affiliation: "",
      position: "",
      paper_title: "",
      email: "",
      researcher_id: "",
      ...defaultValues
    }
  });

  // Update form values when defaultValues prop changes
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      // Reset form with new values
      const valuesToSet = { ...form.getValues(), ...defaultValues };
      
      // Update each field individually to trigger field-level validation
      Object.entries(defaultValues).forEach(([key, value]) => {
        form.setValue(key as keyof FormValues, value as string, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    }
  }, [defaultValues, form]);

  // When we don't have a researcher ID but have submitted the form,
  // try to find the researcher by name/email in Supabase
  useEffect(() => {
    let isActive = true;
    
    const findResearcherId = async () => {
      if (!researcherId && formStarted && (submittedName || submittedEmail)) {
        try {
          let query = supabase.from('researchers').select('id');
          
          // First try exact matches
          if (submittedName && submittedEmail) {
            // If we have both name and email, try to match both first
            const { data, error } = await query
              .eq('name', submittedName)
              .eq('email', submittedEmail)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!error && data && data.id) {
              console.log('Found researcher by exact name and email match:', data.id);
              setResearcherId(data.id);
              return;
            }
          }
          
          // Then try just email (most reliable)
          if (submittedEmail) {
            const { data, error } = await supabase
              .from('researchers')
              .select('id')
              .eq('email', submittedEmail)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!error && data && data.id) {
              console.log('Found researcher by email match:', data.id);
              setResearcherId(data.id);
              return;
            }
          }
          
          // Then try just name
          if (submittedName) {
            const { data, error } = await supabase
              .from('researchers')
              .select('id')
              .eq('name', submittedName)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!error && data && data.id) {
              console.log('Found researcher by name match:', data.id);
              setResearcherId(data.id);
              return;
            }
          }
          
          // Last attempt: look for recently created researchers (within the last minute)
          const { data, error } = await supabase
            .from('researchers')
            .select('id')
            .gt('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (!error && data && data.id) {
            console.log('Found researcher by recent creation time:', data.id);
            setResearcherId(data.id);
            return;
          }
            
          console.log('No matching researcher found yet, will retry...');
        } catch (err) {
          console.error('Error finding researcher:', err);
        }
      }
    };
    
    // Check immediately
    findResearcherId();
    
    // Set up polling if we don't have an ID yet
    const interval = setInterval(() => {
      if (!researcherId && formStarted) {
        findResearcherId();
      } else {
        clearInterval(interval);
      }
    }, 3000); // Try every 3 seconds
    
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [researcherId, formStarted, submittedName, submittedEmail]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setFormStarted(true);
      setSubmittedName(values.name);
      setSubmittedEmail(values.email || null);
      
      // Always run in background
      const response = await collectResearcherData({
        name: values.name, // Ensure name is explicitly included
        affiliation: values.affiliation || undefined,
        position: values.position || undefined,
        paper_title: values.paper_title || undefined,
        email: values.email || undefined,
        researcher_id: values.researcher_id || undefined
      });
      
      if (response && response.success) {
        if (response.data && response.data.researcher_id) {
          // We have an ID, use it directly
          setResearcherId(response.data.researcher_id);
        } else {
          // No ID in response - this is expected for new researchers
          // We'll find it through polling in the useEffect hook
          console.log('No researcher ID in initial response - will poll for it');
        }
      } else {
        throw new Error(response.message || "Failed to start data collection");
      }
    } catch (error: unknown) {
      console.error("Error collecting researcher data:", error);
      // Check for timeout specifically as we want to handle this differently
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred";
      if (errorMsg.includes("timeout")) {
        setApiError("Request timed out - but don't worry! Data collection is still running in the background. You'll see results appear below as they're collected.");
      } else {
        setApiError(errorMsg || "An error occurred while collecting researcher data");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combined error from both form submission and realtime updates
  const error = apiError || realtimeError;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Researcher Data Collection</CardTitle>
          <CardDescription>
            Enter researcher details to collect information from external sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yoshua Bengio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="affiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. University of Montreal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Professor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paper_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Deep Learning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g. researcher@university.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="researcher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Researcher ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345 or leave blank for new" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pb-2">
                <p className="text-sm text-gray-500">
                  <Info className="inline-block mr-1 mb-1 h-4 w-4" /> 
                  All data collection happens in the background. You'll see results as they come in.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Data Collection
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(error || formStarted) && (
        <Card>
          <CardHeader>
            <CardTitle>Collection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {formStarted && !researcher && !researcherId && (
              <div className="space-y-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTitle className="text-yellow-800">Collection Started</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your data collection request has been submitted. We're waiting for the researcher
                    record to be created in the database...
                  </AlertDescription>
                </Alert>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Initializing...</p>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {formStarted && !researcher && researcherId && progress < 100 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Collecting data...</p>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Data collection typically takes 2-5 minutes. Results will appear below as they're processed.
                </p>
              </div>
            )}
            
            {researcher && researcher.status === "background_started" && (
              <div className="space-y-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTitle className="text-yellow-800">Data Collection In Progress</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your request is being processed in the background. Data will appear below as it's collected.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Processing...</p>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {researcher && <ResearcherDataDisplay data={{
              success: true,
              message: "Researcher data retrieved successfully",
              data: researcher
            }} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 