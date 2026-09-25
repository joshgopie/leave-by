"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./ui/Card";
import { Clock3, Check, X, CalendarDays } from "lucide-react";

interface ArrivalTimeCardProps {
  value: string;
  onChange: (value: string) => void;
  mode: "arrive" | "leaveNow";
  onModeChange: (mode: "arrive" | "leaveNow") => void;
  onDateChange?: (date: string) => void;
  onCalculate: (
    mode: "arrive" | "leaveNow",
    values?: {
      arrivalDate?: string;
      arrivalTime?: string;
    }
  ) => void;
}

/* ============================================================
   PICKER CONFIGURATION
============================================================ */

const ROW_HEIGHT = 44;
const PICKER_HEIGHT = 176;

const SIDE_PADDING = (PICKER_HEIGHT - ROW_HEIGHT) / 2;

const LOOP_COUNT = 21;
const MIDDLE_LOOP = Math.floor(LOOP_COUNT / 2);

const DATE_COUNT = 8;

const LOOP_RESET_THRESHOLD = 3;

const OPEN_POSITION_DELAY = 40;
const PROGRAMMATIC_LOCK_DELAY = 80;
const SNAP_DELAY = 70;

/* ============================================================
   PICKER DATA
============================================================ */

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);

const MINUTES = Array.from({ length: 60 }, (_, index) => index);

const PERIODS = ["AM", "PM"] as const;

/* ============================================================
   DATE HELPERS
============================================================ */

function formatDateValue(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date | null {
  if (!value) return null;

  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getToday(): Date {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

function getDateFromToday(offset: number): Date {
  const date = getToday();

  date.setDate(date.getDate() + offset);

  return date;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ArrivalTimeCard({
  value,
  onChange,
  mode,
  onModeChange,
  onDateChange,
  onCalculate,
}: ArrivalTimeCardProps) {
  /* ==========================================================
     STATE
  ========================================================== */

  const [isOpen, setIsOpen] = useState(false);

  const [selectedHour, setSelectedHour] = useState(8);

  const [selectedMinute, setSelectedMinute] = useState(0);

  const [selectedPeriod, setSelectedPeriod] =
    useState<"AM" | "PM">("AM");

  const [selectedDate, setSelectedDate] = useState(
    formatDateValue(getToday())
  );

  /* ==========================================================
     REFERENCES
  ========================================================== */

  const hourPickerRef = useRef<HTMLDivElement>(null);

  const minutePickerRef = useRef<HTMLDivElement>(null);

  const periodPickerRef = useRef<HTMLDivElement>(null);

  const datePickerRef = useRef<HTMLDivElement>(null);

  const isProgrammaticScroll = useRef(false);

  const isLoopResetting = useRef(false);

  const pickerOpening = useRef(false);

  const lastHourRef = useRef<number | null>(null);

  const lastMinuteRef = useRef<number | null>(null);

  const lastPeriodRef =
    useRef<"AM" | "PM" | null>(null);

  const lastDateIndexRef = useRef<number | null>(null);

  /* ==========================================================
     ANIMATION / SCROLL REFERENCES
  ========================================================== */

  const hourFrame = useRef<number | null>(null);

  const minuteFrame = useRef<number | null>(null);

  const periodFrame = useRef<number | null>(null);

  const dateFrame = useRef<number | null>(null);

  const hourSnapTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const minuteSnapTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const periodSnapTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateSnapTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ==========================================================
     DATE OPTIONS
  ========================================================== */

  const dateOptions = useMemo(() => {
    return Array.from({ length: DATE_COUNT }, (_, index) => {
      const date = getDateFromToday(index);

      return {
        date,
        value: formatDateValue(date),
        index,
      };
    });
  }, []);

  /* ==========================================================
     CURRENT ROUNDED TIME
  ========================================================== */

  function getCurrentRoundedTime(): string {
    const now = new Date();

    let hours24 = now.getHours();

    let minutesValue = now.getMinutes();

    minutesValue = Math.ceil(minutesValue / 15) * 15;

    if (minutesValue === 60) {
      minutesValue = 0;
      hours24 += 1;
    }

    if (hours24 === 24) {
      hours24 = 0;
    }

    return (
      `${hours24.toString().padStart(2, "0")}:` +
      `${minutesValue.toString().padStart(2, "0")}`
    );
  }

  /* ==========================================================
     SYNC PICKER FROM TIME
  ========================================================== */

  function syncPickerFromValue(time: string) {
    if (!time) return;

    const [hours24, minutesValue] = time.split(":").map(Number);

    if (
      !Number.isFinite(hours24) ||
      !Number.isFinite(minutesValue)
    ) {
      return;
    }

    let displayHour = hours24;

    let period: "AM" | "PM" = "AM";

    if (hours24 === 0) {
      displayHour = 12;
      period = "AM";
    } else if (hours24 === 12) {
      displayHour = 12;
      period = "PM";
    } else if (hours24 > 12) {
      displayHour = hours24 - 12;
      period = "PM";
    }

    setSelectedHour(displayHour);
    setSelectedMinute(minutesValue);
    setSelectedPeriod(period);

    lastHourRef.current = displayHour;
    lastMinuteRef.current = minutesValue;
    lastPeriodRef.current = period;
  }

  /* ==========================================================
     DEFAULT ARRIVAL TIME
  ========================================================== */

  useEffect(() => {
    if (value) return;

    onChange(getCurrentRoundedTime());
  }, [value, onChange]);

  /* ==========================================================
     SYNC VALUE
  ========================================================== */

  useEffect(() => {
    if (!value) return;

    syncPickerFromValue(value);
  }, [value]);

  /* ==========================================================
     FORMAT DISPLAY TIME
  ========================================================== */

  function formatTime(time: string): string {
    if (!time) return "";

    const [hours24, minutesValue] = time.split(":").map(Number);

    const date = new Date();

    date.setHours(hours24);
    date.setMinutes(minutesValue);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  /* ==========================================================
     SELECTED DATE LABEL
  ========================================================== */

  function getSelectedDateLabel(): string {
    const selected = parseDateValue(selectedDate);

    if (!selected) {
      return "Today";
    }

    const today = getToday();

    const tomorrow = getDateFromToday(1);

    if (selected.getTime() === today.getTime()) {
      return "Today";
    }

    if (selected.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    return selected.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  /* ==========================================================
     24-HOUR TIME
  ========================================================== */

  function get24HourTime(
    hour: number,
    minute: number,
    period: "AM" | "PM"
  ): string {
    let hours24 = hour;

    if (period === "AM") {
      if (hour === 12) {
        hours24 = 0;
      }
    } else {
      if (hour !== 12) {
        hours24 = hour + 12;
      }
    }

    return (
      `${hours24.toString().padStart(2, "0")}:` +
      `${minute.toString().padStart(2, "0")}`
    );
  }

  /* ==========================================================
     LOOPED ARRAY
  ========================================================== */

  function createLoopedArray<T>(items: T[]) {
    return Array.from(
      {
        length: LOOP_COUNT,
      },
      (_, loopIndex) =>
        items.map((item, itemIndex) => ({
          item,
          loopIndex,
          itemIndex,
        }))
    ).flat();
  }

  const loopedHours = useMemo(
    () => createLoopedArray(HOURS),
    []
  );

  const loopedMinutes = useMemo(
    () => createLoopedArray(MINUTES),
    []
  );

  /* ==========================================================
     INDEX HELPERS
  ========================================================== */

  function getMiddleIndex(
    itemIndex: number,
    itemsLength: number
  ): number {
    return MIDDLE_LOOP * itemsLength + itemIndex;
  }

  function getScrollIndex(scrollTop: number): number {
    return Math.round(scrollTop / ROW_HEIGHT);
  }

  function getLoopItemIndex(
    absoluteIndex: number,
    itemsLength: number
  ): number {
    return (
      ((absoluteIndex % itemsLength) + itemsLength) %
      itemsLength
    );
  }

  function shouldResetLoop(
    absoluteIndex: number,
    itemsLength: number
  ): boolean {
    const currentLoop = Math.floor(
      absoluteIndex / itemsLength
    );

    return (
      currentLoop <= LOOP_RESET_THRESHOLD ||
      currentLoop >=
        LOOP_COUNT - LOOP_RESET_THRESHOLD - 1
    );
  }

  /* ==========================================================
     PROGRAMMATIC SCROLL
  ========================================================== */

  function scrollToIndex(
    element: HTMLDivElement | null,
    index: number,
    smooth = false
  ) {
    if (!element || index < 0) {
      return;
    }

    isProgrammaticScroll.current = true;

    element.scrollTo({
      top: index * ROW_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, PROGRAMMATIC_LOCK_DELAY);
  }

  /* ==========================================================
     RESET HOUR LOOP
  ========================================================== */

  function resetHourLoop(absoluteIndex: number) {
    const picker = hourPickerRef.current;

    if (!picker) return;

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      HOURS.length
    );

    const middleIndex = getMiddleIndex(
      itemIndex,
      HOURS.length
    );

    isLoopResetting.current = true;
    isProgrammaticScroll.current = true;

    picker.scrollTop = middleIndex * ROW_HEIGHT;

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      isLoopResetting.current = false;
    }, PROGRAMMATIC_LOCK_DELAY);
  }

  /* ==========================================================
     RESET MINUTE LOOP
  ========================================================== */

  function resetMinuteLoop(absoluteIndex: number) {
    const picker = minutePickerRef.current;

    if (!picker) return;

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      MINUTES.length
    );

    const middleIndex = getMiddleIndex(
      itemIndex,
      MINUTES.length
    );

    isLoopResetting.current = true;
    isProgrammaticScroll.current = true;

    picker.scrollTop = middleIndex * ROW_HEIGHT;

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      isLoopResetting.current = false;
    }, PROGRAMMATIC_LOCK_DELAY);
  }

  /* ==========================================================
     HOUR SCROLL
  ========================================================== */

  function handleHourScroll() {
    const picker = hourPickerRef.current;

    if (
      !picker ||
      isProgrammaticScroll.current ||
      isLoopResetting.current
    ) {
      return;
    }

    const absoluteIndex = getScrollIndex(
      picker.scrollTop
    );

    if (
      shouldResetLoop(
        absoluteIndex,
        HOURS.length
      )
    ) {
      resetHourLoop(absoluteIndex);
    }

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      HOURS.length
    );

    const hour = HOURS[itemIndex];

    if (lastHourRef.current !== hour) {
      lastHourRef.current = hour;

      setSelectedHour(hour);
    }
  }

  /* ==========================================================
     MINUTE SCROLL
  ========================================================== */

  function handleMinuteScroll() {
    const picker = minutePickerRef.current;

    if (
      !picker ||
      isProgrammaticScroll.current ||
      isLoopResetting.current
    ) {
      return;
    }

    const absoluteIndex = getScrollIndex(
      picker.scrollTop
    );

    if (
      shouldResetLoop(
        absoluteIndex,
        MINUTES.length
      )
    ) {
      resetMinuteLoop(absoluteIndex);
    }

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      MINUTES.length
    );

    const minute = MINUTES[itemIndex];

    if (lastMinuteRef.current !== minute) {
      lastMinuteRef.current = minute;

      setSelectedMinute(minute);
    }
  }

  /* ==========================================================
     PERIOD SCROLL
  ========================================================== */

  function handlePeriodScroll() {
    const picker = periodPickerRef.current;

    if (
      !picker ||
      isProgrammaticScroll.current
    ) {
      return;
    }

    const index = getScrollIndex(
      picker.scrollTop
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, PERIODS.length - 1)
    );

    const period = PERIODS[safeIndex];

    if (lastPeriodRef.current !== period) {
      lastPeriodRef.current = period;

      setSelectedPeriod(period);
    }
  }

  /* ==========================================================
     DATE SCROLL
  ========================================================== */

  function handleDateScroll() {
    const picker = datePickerRef.current;

    if (
      !picker ||
      isProgrammaticScroll.current
    ) {
      return;
    }

    const index = getScrollIndex(
      picker.scrollTop
    );

    const safeIndex = Math.max(
      0,
      Math.min(
        index,
        dateOptions.length - 1
      )
    );

    const option = dateOptions[safeIndex];

    if (!option) return;

    if (
      lastDateIndexRef.current !==
      safeIndex
    ) {
      lastDateIndexRef.current = safeIndex;

      setSelectedDate(option.value);
    }
  }

  /* ==========================================================
     SNAP HOUR
  ========================================================== */

  function snapHour() {
    const picker = hourPickerRef.current;

    if (!picker) return;

    const absoluteIndex = getScrollIndex(
      picker.scrollTop
    );

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      HOURS.length
    );

    const middleIndex = getMiddleIndex(
      itemIndex,
      HOURS.length
    );

    scrollToIndex(
      picker,
      middleIndex
    );

    setSelectedHour(HOURS[itemIndex]);
  }

  /* ==========================================================
     SNAP MINUTE
  ========================================================== */

  function snapMinute() {
    const picker = minutePickerRef.current;

    if (!picker) return;

    const absoluteIndex = getScrollIndex(
      picker.scrollTop
    );

    const itemIndex = getLoopItemIndex(
      absoluteIndex,
      MINUTES.length
    );

    const middleIndex = getMiddleIndex(
      itemIndex,
      MINUTES.length
    );

    scrollToIndex(
      picker,
      middleIndex
    );

    setSelectedMinute(
      MINUTES[itemIndex]
    );
  }

  /* ==========================================================
     SNAP PERIOD
  ========================================================== */

  function snapPeriod() {
    const picker = periodPickerRef.current;

    if (!picker) return;

    const index = getScrollIndex(
      picker.scrollTop
    );

    const safeIndex = Math.max(
      0,
      Math.min(
        index,
        PERIODS.length - 1
      )
    );

    scrollToIndex(
      picker,
      safeIndex
    );

    setSelectedPeriod(
      PERIODS[safeIndex]
    );
  }

  /* ==========================================================
     SNAP DATE
  ========================================================== */

  function snapDate() {
    const picker = datePickerRef.current;

    if (!picker) return;

    const index = getScrollIndex(
      picker.scrollTop
    );

    const safeIndex = Math.max(
      0,
      Math.min(
        index,
        dateOptions.length - 1
      )
    );

    scrollToIndex(
      picker,
      safeIndex
    );

    const option = dateOptions[safeIndex];

    if (!option) return;

    setSelectedDate(option.value);
  }

  /* ==========================================================
     SNAP SCHEDULERS
  ========================================================== */

  function scheduleHourSnap() {
    if (hourSnapTimeout.current) {
      clearTimeout(hourSnapTimeout.current);
    }

    hourSnapTimeout.current = setTimeout(
      snapHour,
      SNAP_DELAY
    );
  }

  function scheduleMinuteSnap() {
    if (minuteSnapTimeout.current) {
      clearTimeout(
        minuteSnapTimeout.current
      );
    }

    minuteSnapTimeout.current = setTimeout(
      snapMinute,
      SNAP_DELAY
    );
  }

  function schedulePeriodSnap() {
    if (periodSnapTimeout.current) {
      clearTimeout(
        periodSnapTimeout.current
      );
    }

    periodSnapTimeout.current = setTimeout(
      snapPeriod,
      SNAP_DELAY
    );
  }

  function scheduleDateSnap() {
    if (dateSnapTimeout.current) {
      clearTimeout(
        dateSnapTimeout.current
      );
    }

    dateSnapTimeout.current = setTimeout(
      snapDate,
      SNAP_DELAY
    );
  }

  /* ==========================================================
     SCROLL EVENTS
  ========================================================== */

  function onHourScroll() {
    if (hourFrame.current) {
      cancelAnimationFrame(
        hourFrame.current
      );
    }

    hourFrame.current =
      requestAnimationFrame(() => {
        handleHourScroll();
        scheduleHourSnap();
      });
  }

  function onMinuteScroll() {
    if (minuteFrame.current) {
      cancelAnimationFrame(
        minuteFrame.current
      );
    }

    minuteFrame.current =
      requestAnimationFrame(() => {
        handleMinuteScroll();
        scheduleMinuteSnap();
      });
  }

  function onPeriodScroll() {
    if (periodFrame.current) {
      cancelAnimationFrame(
        periodFrame.current
      );
    }

    periodFrame.current =
      requestAnimationFrame(() => {
        handlePeriodScroll();
        schedulePeriodSnap();
      });
  }

  function onDateScroll() {
    if (dateFrame.current) {
      cancelAnimationFrame(
        dateFrame.current
      );
    }

    dateFrame.current =
      requestAnimationFrame(() => {
        handleDateScroll();
        scheduleDateSnap();
      });
  }

  /* ==========================================================
     OPEN PICKER
  ========================================================== */

  function openPicker() {
    pickerOpening.current = true;

    if (!value) {
      const currentTime =
        getCurrentRoundedTime();

      syncPickerFromValue(
        currentTime
      );
    }

    if (!selectedDate) {
      setSelectedDate(
        formatDateValue(getToday())
      );
    }

    setIsOpen(true);
  }

  /* ==========================================================
     POSITION PICKERS AFTER OPENING
  ========================================================== */

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      const hourIndex = getMiddleIndex(
        selectedHour - 1,
        HOURS.length
      );

      const minuteIndex = getMiddleIndex(
        selectedMinute,
        MINUTES.length
      );

      const periodIndex =
        PERIODS.indexOf(
          selectedPeriod
        );

      const selectedDateOption =
        dateOptions.findIndex(
          (option) =>
            option.value === selectedDate
        );

      const dateIndex =
        selectedDateOption >= 0
          ? selectedDateOption
          : 0;

      isProgrammaticScroll.current = true;

      if (hourPickerRef.current) {
        hourPickerRef.current.scrollTop =
          hourIndex * ROW_HEIGHT;
      }

      if (minutePickerRef.current) {
        minutePickerRef.current.scrollTop =
          minuteIndex * ROW_HEIGHT;
      }

      if (periodPickerRef.current) {
        periodPickerRef.current.scrollTop =
          periodIndex * ROW_HEIGHT;
      }

      if (datePickerRef.current) {
        datePickerRef.current.scrollTop =
          dateIndex * ROW_HEIGHT;
      }

      lastHourRef.current =
        selectedHour;

      lastMinuteRef.current =
        selectedMinute;

      lastPeriodRef.current =
        selectedPeriod;

      lastDateIndexRef.current =
        dateIndex;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isProgrammaticScroll.current =
            false;

          pickerOpening.current =
            false;
        });
      });
    }, OPEN_POSITION_DELAY);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  /* ==========================================================
     CANCEL
  ========================================================== */

  function handleCancel() {
    syncPickerFromValue(value);

    setSelectedDate(
      formatDateValue(getToday())
    );

    setIsOpen(false);
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  function handleDone() {
    const newTime = get24HourTime(
      selectedHour,
      selectedMinute,
      selectedPeriod
    );

    onChange(newTime);

    if (onDateChange) {
      onDateChange(selectedDate);
    }

    setIsOpen(false);

    onCalculate("arrive", {
      arrivalDate: selectedDate,
      arrivalTime: newTime,
    });
  }

  /* ==========================================================
     PREVENT BACKGROUND SCROLL
  ========================================================== */

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [isOpen]);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      if (hourFrame.current) {
        cancelAnimationFrame(
          hourFrame.current
        );
      }

      if (minuteFrame.current) {
        cancelAnimationFrame(
          minuteFrame.current
        );
      }

      if (periodFrame.current) {
        cancelAnimationFrame(
          periodFrame.current
        );
      }

      if (dateFrame.current) {
        cancelAnimationFrame(
          dateFrame.current
        );
      }

      if (hourSnapTimeout.current) {
        clearTimeout(
          hourSnapTimeout.current
        );
      }

      if (minuteSnapTimeout.current) {
        clearTimeout(
          minuteSnapTimeout.current
        );
      }

      if (periodSnapTimeout.current) {
        clearTimeout(
          periodSnapTimeout.current
        );
      }

      if (dateSnapTimeout.current) {
        clearTimeout(
          dateSnapTimeout.current
        );
      }
    };
  }, []);

  /* ==========================================================
     DISPLAY VALUES
  ========================================================== */

  const formattedTime =
    formatTime(value);

  const selectedDateLabel =
    getSelectedDateLabel();

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <Card>
        <div className="space-y-5">

          {/* MODE BUTTONS */}

          <div className="flex gap-2 rounded-2xl bg-white/[0.20] p-1.5">
            <button
              type="button"
              onClick={() =>
                onModeChange("arrive")
              }
              className={`
                flex-1
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                transition-all
                duration-200
                ${
                  mode === "arrive"
                    ? "bg-blue-500 text-white shadow-lg  bg-blue-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }
              `}
            >
              Arrive By
            </button>

            <button
              type="button"
              onClick={() => {
                onModeChange("leaveNow");
              }}
              className={`
                flex-1
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                transition-all
                duration-200
                ${
                  mode === "leaveNow"
                    ? "bg-blue-500 text-white shadow-lg  bg-blue-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }
              `}
            >
              Leave Now
            </button>
          </div>

          {/* HEADER */}

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/10">
              <Clock3
                className="text-blue-400"
                size={21}
              />
            </div>

            <div className="min-w-0">
             

              <h2 className="mt-0.5 text-[15px] font-semibold leading-5 text-white">
                {mode === "arrive"
                  ? "What time do you need to arrive?"
                  : "Travel duration will be calculated based on your current time"}
              </h2>
            </div>
          </div>

          {/* TIME BUTTON */}

          {mode === "arrive" && (
            <button
              type="button"
              onClick={openPicker}
              className="
                group
                flex
                w-full
                items-center
                justify-between
                rounded-2xl
                bg-white/[0.08]
                px-4
                py-4
                text-left
                shadow-sm
                transition-all
                duration-200
                hover:border-zinc-700
                hover:bg-zinc-900
                active:scale-[0.99]
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Clock3
                    size={19}
                    className="text-blue-400"
                  />
                </div>

                <div>
                  <span className="block text-3xl font-bold tracking-tight text-white">
                    {formattedTime}
                  </span>

                  <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                    {selectedDateLabel}
                  </span>
                </div>
              </div>

              <span className="rounded-lg bg-white/[0.10] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors group-hover:text-zinc-200">
                Change
              </span>
            </button>
          )}
        </div>
      </Card>

      {/* ======================================================
          PICKER MODAL
      ====================================================== */}

      {isOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/70
            px-4
            backdrop-blur-md
          "
          onClick={handleCancel}
        >
          <div
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-[28px]
              border
              border-zinc-800/80
              bg-zinc-950
              shadow-2xl
              shadow-black/50
              animate-in
              slide-in-from-bottom
              duration-200
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-zinc-800/80
                bg-zinc-950
                px-4
                py-3.5
              "
            >
              <button
                  type="button"
                  onClick={handleCancel}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close result"
                >
                  <X className="shrink-0 text-white-200/50 font-semibold" size={18} />
              </button>

              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Arrive
                </p>

                <p className="mt-0.5 text-lg font-bold tracking-tight text-white">
                  {selectedHour}:
                  {selectedMinute
                    .toString()
                    .padStart(2, "0")}{" "}
                  {selectedPeriod}
                </p>

                <p className="text-xs text-zinc-500">
                  {selectedDateLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDone}
                className="
                  rounded-xl
                  bg-blue-600
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                  transition
                  hover:bg-blue-500
                  active:scale-95
                "
              >
                Done
              </button>
            </div>

            {/* DATE */}

            <div className="px-4 pt-4">
              <div className="mb-2.5 flex items-center gap-2">
                <CalendarDays
                  size={15}
                  className="text-blue-400"
                />

                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Date
                </span>
              </div>

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900/60
                "
              >
                {/* DATE FOCUS */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-2
                    right-2
                    top-1/2
                    z-20
                    h-11
                    -translate-y-1/2
                    rounded-xl
                    border
                    border-blue-500/30
                    bg-blue-500/[0.06]
                    shadow-[0_0_20px_rgba(59,130,246,0.04)]
                  "
                />

                <div
                  ref={datePickerRef}
                  onScroll={onDateScroll}
                  className="
                    relative
                    z-10
                    h-44
                    overflow-y-auto
                    text-center
                    snap-y
                    snap-mandatory
                    overscroll-contain
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                  style={{
                    WebkitOverflowScrolling:
                      "touch",
                    scrollPaddingTop:
                      SIDE_PADDING,
                    scrollPaddingBottom:
                      SIDE_PADDING,
                  }}
                >
                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />

                  {dateOptions.map(
                    (option) => {
                      const isSelected =
                        option.value ===
                        selectedDate;

                      const weekday =
                        option.date.toLocaleDateString(
                          undefined,
                          {
                            weekday:
                              "long",
                          }
                        );

                      const month =
                        option.date.toLocaleDateString(
                          undefined,
                          {
                            month:
                              "short",
                          }
                        );

                      const day =
                        option.date.getDate();

                      let title =
                        weekday;

                      if (
                        option.index === 0
                      ) {
                        title = "Today";
                      } else if (
                        option.index === 1
                      ) {
                        title =
                          "Tomorrow";
                      }

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() => {
                            setSelectedDate(
                              option.value
                            );

                            lastDateIndexRef.current =
                              option.index;

                            scrollToIndex(
                              datePickerRef.current,
                              option.index,
                              true
                            );
                          }}
                          className={`
                            flex
                            h-11
                            w-full
                            snap-center
                            items-center
                            justify-center
                            gap-3
                            px-4
                            transition-all
                            duration-150
                            ${
                              isSelected
                                ? "font-semibold text-blue-400"
                                : "text-zinc-500 hover:text-zinc-300"
                            }
                          `}
                        >
                          <span className="w-20 text-right text-sm">
                            {title}
                          </span>

                          <span className="w-16 text-left text-sm">
                            {month}{" "}
                            {day}
                          </span>
                        </button>
                      );
                    }
                  )}

                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TIME */}

            <div className="px-4 pb-4 pt-4">
              <div className="mb-2.5 flex items-center gap-2">
                <Clock3
                  size={15}
                  className="text-blue-400"
                />

                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Time
                </span>
              </div>

              <div
                className="
                  relative
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {/* FOCUS */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    z-20
                    h-11
                    w-[calc(100%-8px)]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-xl
                    border
                    border-blue-500/30
                    bg-blue-500/[0.06]
                  "
                />

                {/* HOUR */}

                <div
                  ref={hourPickerRef}
                  onScroll={onHourScroll}
                  className="
                    relative
                    z-10
                    h-44
                    w-16
                    overflow-y-auto
                    rounded-2xl
                    border
                    border-zinc-800/70
                    bg-zinc-900
                    text-center
                    snap-y
                    snap-mandatory
                    overscroll-contain
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                  style={{
                    WebkitOverflowScrolling:
                      "touch",
                    scrollPaddingTop:
                      SIDE_PADDING,
                    scrollPaddingBottom:
                      SIDE_PADDING,
                  }}
                >
                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />

                  {loopedHours.map(
                    ({
                      item: hour,
                      loopIndex,
                      itemIndex,
                    }) => (
                      <button
                        key={`hour-${loopIndex}-${hour}`}
                        type="button"
                        onClick={() => {
                          setSelectedHour(
                            hour
                          );

                          scrollToIndex(
                            hourPickerRef.current,
                            getMiddleIndex(
                              itemIndex,
                              HOURS.length
                            ),
                            true
                          );
                        }}
                        className={`
                          flex
                          h-11
                          w-full
                          snap-center
                          items-center
                          justify-center
                          text-lg
                          transition-all
                          duration-150
                          ${
                            selectedHour ===
                            hour
                              ? "font-bold text-blue-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }
                        `}
                      >
                        {hour}
                      </button>
                    )
                  )}

                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />
                </div>

                {/* COLON */}

                <div
                  className="
                    relative
                    z-10
                    text-xl
                    font-bold
                    text-zinc-600
                  "
                >
                  :
                </div>

                {/* MINUTE */}

                <div
                  ref={minutePickerRef}
                  onScroll={onMinuteScroll}
                  className="
                    relative
                    z-10
                    h-44
                    w-16
                    overflow-y-auto
                    rounded-2xl
                    border
                    border-zinc-800/70
                    bg-zinc-900
                    text-center
                    snap-y
                    snap-mandatory
                    overscroll-contain
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                  style={{
                    WebkitOverflowScrolling:
                      "touch",
                    scrollPaddingTop:
                      SIDE_PADDING,
                    scrollPaddingBottom:
                      SIDE_PADDING,
                  }}
                >
                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />

                  {loopedMinutes.map(
                    ({
                      item: minute,
                      loopIndex,
                      itemIndex,
                    }) => (
                      <button
                        key={`minute-${loopIndex}-${minute}`}
                        type="button"
                        onClick={() => {
                          setSelectedMinute(
                            minute
                          );

                          scrollToIndex(
                            minutePickerRef.current,
                            getMiddleIndex(
                              itemIndex,
                              MINUTES.length
                            ),
                            true
                          );
                        }}
                        className={`
                          flex
                          h-11
                          w-full
                          snap-center
                          items-center
                          justify-center
                          text-lg
                          transition-all
                          duration-150
                          ${
                            selectedMinute ===
                            minute
                              ? "font-bold text-blue-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }
                        `}
                      >
                        {minute
                          .toString()
                          .padStart(2, "0")}
                      </button>
                    )
                  )}

                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />
                </div>

                {/* AM / PM */}

                <div
                  ref={periodPickerRef}
                  onScroll={onPeriodScroll}
                  className="
                    relative
                    z-10
                    h-44
                    w-16
                    overflow-y-auto
                    rounded-2xl
                    border
                    border-zinc-800/70
                    bg-zinc-900
                    text-center
                    snap-y
                    snap-mandatory
                    overscroll-contain
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                  style={{
                    WebkitOverflowScrolling:
                      "touch",
                    scrollPaddingTop:
                      SIDE_PADDING,
                    scrollPaddingBottom:
                      SIDE_PADDING,
                  }}
                >
                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />

                  {PERIODS.map(
                    (
                      period,
                      index
                    ) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(
                            period
                          );

                          scrollToIndex(
                            periodPickerRef.current,
                            index,
                            true
                          );
                        }}
                        className={`
                          flex
                          h-11
                          w-full
                          snap-center
                          items-center
                          justify-center
                          text-lg
                          font-semibold
                          transition-all
                          duration-150
                          ${
                            selectedPeriod ===
                            period
                              ? "font-bold text-blue-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }
                        `}
                      >
                        {period}
                      </button>
                    )
                  )}

                  <div
                    style={{
                      height: SIDE_PADDING,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SAVE */}

            <div
              className="
                border-t
                border-zinc-800/80
                bg-zinc-950
                p-3
                pb-[calc(0.75rem+env(safe-area-inset-bottom))]
              "
            >
              <button
                type="button"
                onClick={handleDone}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-blue-600
                  px-4
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                  transition-all
                  duration-200
                  hover:bg-blue-500
                  active:scale-[0.98]
                "
              >
                <Check size={17} />

                Set arrival time
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}