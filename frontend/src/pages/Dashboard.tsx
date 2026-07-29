import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookOpen, Clock, FileText, CheckCircle2, Bot, Sparkles, BrainCircuit, FileUp } from 'lucide-react';

const PROGRESS_DATA = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 94 },
];


export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Learning Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Overall Mastery</p>
              <h4 className="text-2xl font-bold text-surface-900">78%</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Study Hours</p>
              <h4 className="text-2xl font-bold text-surface-900">24.5h</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center text-accent-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Documents</p>
              <h4 className="text-2xl font-bold text-surface-900">12</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Quizzes Done</p>
              <h4 className="text-2xl font-bold text-surface-900">8</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 5. Quiz Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>Your accuracy over the last 7 days</CardDescription>
              </div>
              <Badge variant="success">Trending Up</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PROGRESS_DATA}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 6. Uploaded Materials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Materials ready for Q&A and Quizzes</CardDescription>
              </div>
              <Button size="sm" variant="outline" leftIcon={<FileUp className="w-4 h-4" />}>Upload</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Cellular Biology Chapter 4.pdf', subject: 'Biology', status: 'Processed', date: '2 hours ago' },
                  { name: 'World War II Timeline.docx', subject: 'History', status: 'Processing', date: '5 hours ago' },
                  { name: 'Calculus Derivatives.pdf', subject: 'Math', status: 'Processed', date: '1 day ago' },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-surface-500">{doc.date}</span>
                          <span className="text-surface-300">•</span>
                          <Badge variant="secondary" className="text-[10px] py-0">{doc.subject}</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge variant={doc.status === 'Processed' ? 'success' : 'warning'}>{doc.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">

          {/* 2. AI Tutor Section */}
          <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-glow-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                AI Tutor
              </CardTitle>
              <CardDescription className="text-primary-100">Your personal AI is ready to help you study.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="bg-white/10 rounded-lg p-3 text-sm backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 inline-block mr-2 text-accent-400" />
                  Try asking: "Explain the process of mitosis from my notes"
                </div>
              </div>
              <Button className="w-full bg-white text-primary-700 hover:bg-primary-50">
                Start Chat Session
              </Button>
            </CardContent>
          </Card>

          {/* 3. Knowledge Weakness Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Gaps</CardTitle>
              <CardDescription>Topics needing review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-surface-700">Physics (Kinematics)</span>
                    <span className="text-red-600 font-bold">45%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <p className="text-xs text-surface-500 mt-2">Suggestion: Review Chapter 3 slides</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-surface-700">History (Cold War)</span>
                    <span className="text-yellow-600 font-bold">65%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-xs text-surface-500 mt-2">Suggestion: Take a quick 10Q quiz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Study Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Synced with Google Calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold">OCT</span>
                    <span className="text-sm font-black">24</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Physics Revision</p>
                    <p className="text-xs text-surface-500">2:00 PM - 3:30 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="w-10 h-10 rounded-lg bg-surface-200 text-surface-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold">OCT</span>
                    <span className="text-sm font-black">25</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Biology Quiz Prep</p>
                    <p className="text-xs text-surface-500">10:00 AM - 11:00 AM</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2" size="sm">Connect Calendar</Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
