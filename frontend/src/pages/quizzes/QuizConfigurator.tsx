import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, BookOpen, Target, Clock, BrainCircuit, Activity, Zap, FileText } from "lucide-react";

import { quizzesApi } from "../../api/quizzes";
import { documentApi } from "../../api/documents";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { RadioCard } from "../../components/quiz/RadioCard";
import { SegmentedControl } from "../../components/quiz/SegmentedControl";
import { LoadingOverlay } from "../../components/quiz/LoadingOverlay";

export default function QuizConfigurator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'practice';
  const initialDoc = searchParams.get('doc') || '';

  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  // Generation Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const loadingMessages = [
    "🧠 Reading your study materials...",
    "📚 Understanding key concepts...",
    "📝 Creating personalized questions...",
    "🎯 Adjusting difficulty levels...",
    "✨ Almost ready..."
  ];

  // Config State
  const [title, setTitle] = useState("My Custom Quiz");
  const [selectedDoc, setSelectedDoc] = useState(initialDoc);
  const [difficulty, setDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionOrder, setQuestionOrder] = useState("random");
  const [mode, setMode] = useState(initialMode);
  
  // Extract subjectId from SubjectWorkspace
  const { subjectId } = useOutletContext<{ subject: any, subjectId: string }>();

  useEffect(() => {
    fetchDocuments();
    
    const interval = setInterval(() => {
      setDocuments(currentDocs => {
        const hasProcessing = currentDocs.some(
          d => ['PENDING', 'PROCESSING', 'TUTOR_READY', 'EXTRACTING_TOPICS', 'GENERATING_QUESTIONS'].includes(d.status)
        );
        if (hasProcessing) {
          fetchDocuments(false);
        }
        return currentDocs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [subjectId]);

  const fetchDocuments = async (showLoader = true) => {
    if (showLoader) setLoadingDocs(true);
    try {
      // Filter by current subject — same isolation as the Documents page
      const data = await documentApi.listDocuments(0, 100, subjectId);
      setDocuments(data.items);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCreate = async () => {
    if (isGenerating) return; // prevent duplicate clicks
    setIsGenerating(true);
    
    let difficulty_distribution = null;
    if (difficulty === "easy") difficulty_distribution = { EASY: 1.0 };
    else if (difficulty === "medium") difficulty_distribution = { MEDIUM: 1.0 };
    else if (difficulty === "hard") difficulty_distribution = { HARD: 1.0 };
    else difficulty_distribution = { EASY: 0.3, MEDIUM: 0.5, HARD: 0.2 };

    const payload = {
      title: title,
      total_questions: questionCount,
      subject_id: subjectId,
      document_id: selectedDoc || undefined,
      config: {
        difficulty_distribution,
        order: questionOrder,
        question_types: ["MCQ", "TF", "FIB", "SA"]
      }
    };
    console.log("QUIZ CREATE PAYLOAD:", payload);
    
    try {
      const newQuiz = await quizzesApi.createQuiz(payload);
      
      const mappedMode = mode === 'exam' ? 'EXAM' : mode === 'revision' ? 'REVISION' : 'PRACTICE';
      const attempt = await quizzesApi.startAttempt(newQuiz.id, { mode: mappedMode });
      
      // Delay navigation slightly to let the "Almost ready" message show
      setTimeout(() => {
        navigate(`/subjects/${subjectId}/quizzes/play/${attempt.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Failed to create quiz", error);
      const backendDetail = error.response?.data?.detail;
      const userMessage = backendDetail
        ? `Unable to generate quiz: ${backendDetail}`
        : "Unable to generate quiz. Please ensure your document has finished processing and try again.";
      // Use alert as toast may not be imported; keeps existing dependency footprint
      alert(userMessage);
      setIsGenerating(false);
    }
  };

  const selectedDocObj = documents.find(d => d.id === selectedDoc);
  const selectedDocName = selectedDocObj?.title || "Global Question Bank";
  const estDuration = questionCount * 1.5; // ~1.5 mins per question

  const isDocProcessing = selectedDocObj && selectedDocObj.status !== 'COMPLETED' && selectedDocObj.status !== 'FAILED';
  const isDocFailed = selectedDocObj && selectedDocObj.status === 'FAILED';
  const isGenerateDisabled = isGenerating || isDocProcessing || isDocFailed;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in relative min-h-screen overflow-y-auto">
      <LoadingOverlay isVisible={isGenerating} messages={loadingMessages} />

      <button 
        onClick={() => navigate(`/subjects/${subjectId}/quizzes`)}
        className="flex items-center text-surface-500 hover:text-surface-900 transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-surface-900">Configure Quiz</h1>
        <p className="text-surface-600 mt-1">Set up your personalized AI-powered quiz.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column - Config */}
        <div className="flex-1 w-full space-y-10">
          
          {/* Section 1: Material */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-surface-900">Study Material</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-surface-700 mb-1.5 block">Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-surface-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-surface-700 mb-1.5 block">Source Document</label>
                {loadingDocs ? (
                  <div className="animate-pulse h-12 bg-surface-100 rounded-xl w-full"></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                    <RadioCard
                      title="Global Bank"
                      description="All available material"
                      icon={<BrainCircuit className="w-5 h-5" />}
                      selected={selectedDoc === ""}
                      onClick={() => setSelectedDoc("")}
                    />
                    {documents.map(doc => {
                      const isProcessing = ['PENDING', 'PROCESSING', 'TUTOR_READY', 'EXTRACTING_TOPICS', 'GENERATING_QUESTIONS'].includes(doc.status);
                      const isFailed = doc.status === 'FAILED';
                      const isReady = doc.quiz_ready;
                      
                      let displayIcon = <FileText className="w-5 h-5" />;
                      if (isProcessing) displayIcon = <Clock className="w-5 h-5 animate-spin text-warning-500" />;
                      else if (isFailed) displayIcon = <Activity className="w-5 h-5 text-red-500" />;
                      
                      let description = `${(doc.file_size/1024/1024).toFixed(1)}MB`;
                      if (isProcessing) description = "Processing...";
                      else if (isFailed) description = "Failed to process";

                      return (
                        <RadioCard
                          key={doc.id}
                          title={doc.title}
                          description={description}
                          icon={displayIcon}
                          selected={selectedDoc === doc.id}
                          disabled={!isReady}
                          onClick={() => {
                            if (isReady) setSelectedDoc(doc.id);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-surface-900">Quiz Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Question Count */}
              <div>
                <label className="text-sm font-semibold text-surface-700 mb-2 block">Length</label>
                <SegmentedControl 
                  options={[
                    { label: "5", value: 5 },
                    { label: "10", value: 10 },
                    { label: "20", value: 20 },
                    { label: "30", value: 30 }
                  ]}
                  value={questionCount}
                  onChange={setQuestionCount}
                />
              </div>

              {/* Question Order */}
              <div>
                <label className="text-sm font-semibold text-surface-700 mb-2 block">Ordering</label>
                <SegmentedControl 
                  options={[
                    { label: "Random", value: "random" },
                    { label: "Progressive", value: "difficulty_asc" }
                  ]}
                  value={questionOrder}
                  onChange={setQuestionOrder}
                />
              </div>

              {/* Difficulty */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-surface-700 mb-2 block">Difficulty Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <RadioCard
                    title="Easy"
                    selected={difficulty === "easy"}
                    onClick={() => setDifficulty("easy")}
                    className="py-3 px-3"
                  />
                  <RadioCard
                    title="Medium"
                    selected={difficulty === "medium"}
                    onClick={() => setDifficulty("medium")}
                    className="py-3 px-3"
                  />
                  <RadioCard
                    title="Hard"
                    selected={difficulty === "hard"}
                    onClick={() => setDifficulty("hard")}
                    className="py-3 px-3"
                  />
                  <RadioCard
                    title="Adaptive"
                    selected={difficulty === "mixed"}
                    onClick={() => setDifficulty("mixed")}
                    className="py-3 px-3"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Mode */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-surface-900">Quiz Mode</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RadioCard
                title="Practice"
                description="See explanations instantly"
                selected={mode === "practice"}
                onClick={() => setMode("practice")}
              />
              <RadioCard
                title="Exam"
                description="Results only after submission"
                selected={mode === "exam"}
                onClick={() => setMode("exam")}
              />
              <RadioCard
                title="Revision"
                description="Focus on your weak topics"
                selected={mode === "challenge"}
                onClick={() => setMode("challenge")}
              />
            </div>
          </section>
        </div>

        {/* Right Column - Live Summary Sticky Card */}
        <div className="w-full lg:w-80 lg:sticky lg:top-8 shrink-0">
          <Card className="border-primary-100 bg-gradient-to-b from-white to-primary-50/30 shadow-xl shadow-primary-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6 text-primary-600">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="font-bold text-lg text-surface-900">Live Summary</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-surface-500">Source</span>
                  <span className="text-sm font-semibold text-surface-900 text-right max-w-[140px] truncate" title={selectedDocName}>
                    {selectedDocName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">Questions</span>
                  <span className="text-sm font-semibold text-surface-900">{questionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">Est. Duration</span>
                  <span className="text-sm font-semibold text-surface-900 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-surface-400" />
                    ~{estDuration} mins
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">Difficulty</span>
                  <span className="text-sm font-semibold text-surface-900 capitalize">{difficulty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">Mode</span>
                  <span className="text-sm font-semibold text-surface-900 capitalize">{mode}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-surface-200">
                {isDocProcessing && (
                  <p className="text-center text-sm font-medium text-warning-600 mb-3">
                    Document is still being processed. Please wait.
                  </p>
                )}
                {isDocFailed && (
                  <p className="text-center text-sm font-medium text-red-600 mb-3">
                    Document failed to process. Cannot generate quiz.
                  </p>
                )}
                <Button 
                  variant="primary" 
                  className="w-full shadow-glow-primary text-base py-6 rounded-2xl" 
                  onClick={handleCreate}
                  disabled={isGenerateDisabled}
                >
                  Generate Quiz
                </Button>
                <p className="text-center text-xs text-surface-400 mt-3 flex items-center justify-center gap-1">
                  <BrainCircuit size={12}/> AI Confidence High
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
