import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { calendarApi, type CalendarEvent } from '../api/calendar';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    calendarApi.getEvents(currentDate.getMonth(), currentDate.getFullYear())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getEventsForDay = (day: number) => events.filter(e => e.date.getDate() === day);

  const getEventColor = (type: string) => {
    switch(type) {
      case 'quiz': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'revision': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'exam': return 'bg-primary-50 text-primary-700 border-primary-200 font-bold';
      case 'study': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary-600" />
            Calendar
          </h1>
          <p className="text-surface-500 mt-1">Manage your academic schedule and upcoming revisions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 border border-surface-200 rounded-lg hover:bg-surface-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold w-48 text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 border border-surface-200 rounded-lg hover:bg-surface-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <Card className="bg-white border-surface-200 overflow-hidden shadow-sm relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50/80 z-10 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="font-medium">Loading calendar...</p>
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-surface-200 bg-surface-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-surface-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[140px]">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-surface-100 bg-surface-50/30 p-2" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
            const dayEvents = getEventsForDay(day);

            return (
              <div key={day} className={`border-b border-r border-surface-100 p-2 hover:bg-surface-50 transition-colors relative ${isToday ? 'bg-primary-50/30' : ''}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-1
                  ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-surface-700'}`}>
                  {day}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[90px] pr-1 custom-scrollbar">
                  {dayEvents.map(event => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs px-2 py-1.5 rounded-md border flex flex-col gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event.type)}`}
                    >
                      <span className="font-semibold truncate">{event.title}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold opacity-70 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {event.type}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
    </div>
  );
}
