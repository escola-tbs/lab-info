import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Sunset,
  LayoutGrid,
  CalendarDays
} from 'lucide-react';
import { formatDateBR, formatDayOfWeek, addDays, getTodayString } from '../utils/date';

interface DateNavigatorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  periodFilter: 'all' | 'manha' | 'tarde';
  onPeriodFilterChange: (filter: 'all' | 'manha' | 'tarde') => void;
  viewMode: 'day' | 'week';
  onViewModeChange: (mode: 'day' | 'week') => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  periodFilter,
  onPeriodFilterChange,
  viewMode,
  onViewModeChange,
}) => {
  const today = getTodayString();
  const isToday = currentDate === today;

  // Calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Month & year for calendar popover view
  const [viewYear, setViewYear] = useState(() => {
    const parts = (currentDate || today).split('-').map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (currentDate || today).split('-').map(Number);
    return (parts[1] ? parts[1] - 1 : new Date().getMonth());
  });

  // Sync calendar view month/year when calendar opens or date changes
  useEffect(() => {
    if (isCalendarOpen && currentDate) {
      const [y, m] = currentDate.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [isCalendarOpen, currentDate]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsCalendarOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  const handlePrevMonth = () => {
    setSlideDirection('right');
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setTimeout(() => setSlideDirection(null), 250);
  };

  const handleNextMonth = () => {
    setSlideDirection('left');
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setTimeout(() => setSlideDirection(null), 250);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartXRef.current;
      const deltaY = endY - touchStartYRef.current;

      // Minimum swipe distance of 35px and more horizontal than vertical
      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (deltaX < 0) {
          // Swiped left -> next month
          handleNextMonth();
        } else {
          // Swiped right -> previous month
          handlePrevMonth();
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleSelectDay = (dateStr: string) => {
    onDateChange(dateStr);
    setIsCalendarOpen(false);
  };

  // Generate calendar days for viewYear & viewMonth
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; day: number; isCurrentMonth: boolean }[] = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ dateStr, day, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, day: d, isCurrentMonth: true });
    }

    // Next month filler days to complete rows (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, day: d, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevDay = () => {
    onDateChange(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300/80 shadow-xs p-3 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left: Date Switcher & Day Info */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 w-full lg:w-auto">
          {/* Day Navigation Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-300/70">
            <button
              onClick={handlePrevDay}
              title="Dia anterior"
              className="p-1.5 sm:p-2 hover:bg-white text-slate-700 hover:text-green-700 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleToday}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isToday
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={handleNextDay}
              title="Próximo dia"
              className="p-1.5 sm:p-2 hover:bg-white text-slate-700 hover:text-green-700 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Formatted Date & Weekday */}
          <div
            ref={triggerRef}
            className="relative flex items-center gap-2 sm:gap-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 px-2.5 sm:px-3.5 py-1.5 rounded-xl shrink-0 transition-colors shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className="flex items-center gap-1.5 group select-none cursor-pointer focus:outline-hidden"
              title="Abrir calendário interativo"
            >
              <CalendarIcon className="w-4 h-4 text-green-700 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap group-hover:text-green-800 transition-colors">
                {formatDateBR(currentDate)}
              </span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs sm:text-sm font-medium text-slate-600 capitalize whitespace-nowrap">
              {formatDayOfWeek(currentDate)}
            </span>

            {/* Interactive Calendar Modal with Swipe Support */}
            {isCalendarOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-2xs"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsCalendarOpen(false);
                  }
                }}
              >
                <div
                  ref={popoverRef}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-full max-w-[320px] animate-in fade-in zoom-in-95 duration-150 select-none touch-pan-y"
                >
                  {/* Header: Month & Year with Navigation & Swipe Hint */}
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMonth();
                      }}
                      title="Mês anterior"
                      aria-label="Mês anterior"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-green-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-800 select-none">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextMonth();
                      }}
                      title="Próximo mês"
                      aria-label="Próximo mês"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-green-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Labels */}
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                    {WEEKDAY_NAMES.map((name, i) => (
                      <span
                        key={name}
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          i === 0 || i === 6 ? 'text-amber-600/80' : 'text-slate-400'
                        }`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Day Grid with smooth transition */}
                  <div
                    className={`grid grid-cols-7 gap-1 text-center transition-all duration-200 ${
                      slideDirection === 'left'
                        ? 'translate-x-1 opacity-70'
                        : slideDirection === 'right'
                        ? '-translate-x-1 opacity-70'
                        : 'translate-x-0 opacity-100'
                    }`}
                  >
                    {calendarCells.map((cell, idx) => {
                      const isSelected = cell.dateStr === currentDate;
                      const isCellToday = cell.dateStr === today;
                      return (
                        <button
                          key={`${cell.dateStr}-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDay(cell.dateStr);
                          }}
                          className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-green-700 text-white shadow-xs font-bold scale-105'
                              : isCellToday
                              ? 'bg-green-50 text-green-700 font-bold border border-green-300'
                              : !cell.isCurrentMonth
                              ? 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'
                              : 'text-slate-700 hover:bg-green-50 hover:text-green-800'
                          }`}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDay(today);
                      }}
                      className="font-semibold text-green-700 hover:text-green-800 hover:underline cursor-pointer"
                    >
                      Ir para Hoje
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCalendarOpen(false);
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Shift Filters */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-medium text-slate-600 w-full sm:w-auto justify-center overflow-x-auto border border-slate-300/70">
          <button
            onClick={() => onPeriodFilterChange('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-white text-green-800 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Todos os Turnos</span>
            <span className="sm:hidden">Todos</span>
          </button>
          <button
            onClick={() => onPeriodFilterChange('manha')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              periodFilter === 'manha'
                ? 'bg-white text-amber-700 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden md:inline">Manhã (07h-12h)</span>
            <span className="md:hidden">Manhã</span>
          </button>
          <button
            onClick={() => onPeriodFilterChange('tarde')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              periodFilter === 'tarde'
                ? 'bg-white text-orange-700 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="hidden md:inline">Tarde (13h30-18h30)</span>
            <span className="md:hidden">Tarde</span>
          </button>
        </div>

        {/* Right: View Switcher (Day / Week) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center border border-slate-300/70">
          <button
            onClick={() => onViewModeChange('day')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dia</span>
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Semana</span>
          </button>
        </div>
      </div>
    </div>
  );
};
