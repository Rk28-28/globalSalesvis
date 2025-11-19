import {
  endDateRaw,
  startDateRaw,
  dataEndDate,
  dataStartDate,
  animationTimeframe,
  animationPlaying,
  animationDelay,
} from "./mapStates.svelte";
import { toHTMLFormat } from "./utils";

let originalStartDate: string | null = "";
let originalEndDate: string | null = "";
let interval: NodeJS.Timeout | null;

// had weird issues with this, state kept changing when not updated. keep as singleton
let stopDate: Date | null = null;

const day = 1000 * 60 * 60 * 24;

export function startAnimation() {
  // instantiate singletons
  if (!stopDate) {
    stopDate = new Date(dataEndDate.state || "");
  }
  if (originalStartDate == "") {
    originalStartDate = startDateRaw.state;
  }
  if (originalEndDate == "") {
    originalEndDate = endDateRaw.state;
  }

  let startDate = new Date(startDateRaw.state);
  let endDate = new Date(endDateRaw.state);

  if (isNaN(startDate.getTime()) && dataStartDate.state) {
    console.log(dataStartDate.state);
    startDate = dataStartDate.state;
  }
  if (isNaN(endDate.getTime()) && dataEndDate.state) {
    endDate = dataEndDate.state;
  }

  const timeframe = animationTimeframe.state;
  if (timeframe == "day") {
    endDate.setTime(startDate.getTime() + day);
  } else if (timeframe == "week") {
    endDate.setTime(startDate.getTime() + day * 7);
  } else if (timeframe == "month") {
    endDate.setMonth((startDate.getMonth() + 1) % 12);
  }

  animationPlaying.state = "playing";
  interval = setInterval(() => {
    if (stopDate && interval && startDate > stopDate) {
      clearInterval(interval);
      interval = null;
      animationPlaying.state = "stopped";
    }

    if (timeframe == "day") {
      startDate.setTime(startDate.getTime() + day);
      endDate.setTime(endDate.getTime() + day);
    } else if (timeframe == "week") {
      startDate.setTime(startDate.getTime() + day * 7);
      endDate.setTime(endDate.getTime() + day * 7);
    } else if (timeframe == "month") {
      startDate.setMonth((startDate.getMonth() + 1) % 12);
      endDate.setMonth((endDate.getMonth() + 1) % 12);
    }

    startDateRaw.state = toHTMLFormat(startDate);
    endDateRaw.state = toHTMLFormat(endDate);
  }, animationDelay.state);
}

// similar to stop animation, but current dates are preserved
export function pauseAnimation() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  animationPlaying.state = "paused";

  originalStartDate = "";
  originalEndDate = "";
}

export function stopAnimation() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  animationPlaying.state = "stopped";

  restoreDates();
}

export function handleDelayChange() {
  if (animationPlaying.state == "playing" && interval) {
    clearInterval(interval);
    interval = null;
    startAnimation();
  }
}

function restoreDates() {
  startDateRaw.state = "";
  endDateRaw.state = "";

  originalStartDate = "";
  originalEndDate = "";
}
