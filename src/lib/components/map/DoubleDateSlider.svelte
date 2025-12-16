<script lang="ts">
  import {
    endDateRaw,
    startDateRaw,
    dataEndDate,
    dataStartDate,
  } from "./mapStates.svelte";
  import { toHTMLFormat } from "./utils";
  let minDate = dataStartDate.state;
  let maxDate = dataEndDate.state;
  // export let startDateIn;
  // export let endDateIn;
  let startDate = new Date(startDateRaw.state);
  if (isNaN(startDate.getTime()) && dataStartDate.state) {
    startDate = dataStartDate.state;
  }
  let endDate = new Date(endDateRaw.state);
  if (isNaN(endDate.getTime()) && dataEndDate.state) {
    endDate = dataEndDate.state;
  }
  $: minRange = minDate.getTime();
  $: maxRange = maxDate.getTime();
  $: start = startDate.getTime();
  $: end = endDate.getTime();
  $: range = maxRange - minRange;

  let rangedelayTimeout: any = null;
  let rangedelay = 50;

  let bodyOffsetPercentage = 0;

  let leftHandle;
  let body;
  let slider;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function rangeToSliderPercent(amt) {
    return (amt - minRange) / range;
  }
  function sliderPercentToRange(amt) {
    return Math.round(minRange + amt * range);
  }
  $: startingPercent = rangeToSliderPercent(start);
  $: endingPercent = rangeToSliderPercent(end);
  function draggable(node) {
    let x;
    let y;
    function handleMousedown(event) {
      if (event.type === "touchstart") {
        event = event.touches[0];
      }
      x = event.clientX;
      y = event.clientY;
      node.dispatchEvent(
        new CustomEvent("dragstart", {
          detail: { x, y },
        }),
      );
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
      window.addEventListener("touchmove", handleMousemove);
      window.addEventListener("touchend", handleMouseup);
    }
    function handleMousemove(event) {
      if (event.type === "touchmove") {
        event = event.changedTouches[0];
      }
      const dx = event.clientX - x;
      const dy = event.clientY - y;
      x = event.clientX;
      y = event.clientY;
      node.dispatchEvent(
        new CustomEvent("dragmove", {
          detail: { x, y, dx, dy },
        }),
      );
    }
    function handleMouseup(event) {
      x = event.clientX;
      y = event.clientY;
      node.dispatchEvent(
        new CustomEvent("dragend", {
          detail: { x, y },
        }),
      );
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
      window.removeEventListener("touchmove", handleMousemove);
      window.removeEventListener("touchend", handleMouseup);
    }
    node.addEventListener("mousedown", handleMousedown);
    node.addEventListener("touchstart", handleMousedown);
    return {
      destroy() {
        node.removeEventListener("mousedown", handleMousedown);
        node.removeEventListener("touchstart", handleMousedown);
      },
    };
  }
  function setHandlePosition(which) {
    return function (evt) {
      const { left, right } = slider.getBoundingClientRect();
      const parentWidth = right - left;
      const p = Math.min(Math.max((evt.detail.x - left) / parentWidth, 0), 1);

      const newRange = sliderPercentToRange(p);
      if (which === "start") {
        //start = p;
        const epoch = Math.min(end, newRange);
        startDate = new Date(epoch);
        if (rangedelayTimeout) clearTimeout(rangedelayTimeout);
        rangedelayTimeout = setTimeout(() => {
          startDateRaw.state = toHTMLFormat(startDate);
        }, rangedelay);
      } else {
        const epoch = Math.max(newRange, start);
        endDate = new Date(epoch);
        if (rangedelayTimeout) clearTimeout(rangedelayTimeout);
        rangedelayTimeout = setTimeout(() => {
          endDateRaw.state = toHTMLFormat(endDate);
        }, rangedelay);
        // endDateRaw.state = toHTMLFormat(endDate);
        //end = p;
      }
    };
  }
  function setHandlesFromBody(evt) {
    const { width } = body.getBoundingClientRect();
    const { left, right } = slider.getBoundingClientRect();
    const parentWidth = right - left;
    const percentDifference = endingPercent - startingPercent;
    const mousePercent = clamp((evt.detail.x - left) / parentWidth, 0, 1);
    const mouseOffset = bodyOffsetPercentage * percentDifference;
    const pStart = clamp(mousePercent - mouseOffset, 0, 1 - percentDifference);
    const pEnd = pStart + percentDifference;
    const newStartEpoch = sliderPercentToRange(pStart);
    const newEndEpoch = sliderPercentToRange(pEnd);
    startDate = new Date(newStartEpoch);
    endDate = new Date(newEndEpoch);
    if (rangedelayTimeout) clearTimeout(rangedelayTimeout);
    rangedelayTimeout = setTimeout(() => {
      startDateRaw.state = toHTMLFormat(startDate);
      endDateRaw.state = toHTMLFormat(endDate);
    }, rangedelay);
    // startDateRaw.state = toHTMLFormat(startDate);
  }

  function handleBodyDragStart(evt: CustomEvent) {
    const { left } = slider.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const sliderBodyLeft = bodyRect.left;

    const mouseXRelativeToSlider = evt.detail.x - left;
    const mouseOffset = mouseXRelativeToSlider - (sliderBodyLeft - left);
    const bodyWidth = bodyRect.width;

    bodyOffsetPercentage = mouseOffset / bodyWidth;
  }

  function format(date) {
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="double-range-container">
  <div class="slider" bind:this={slider}>
    <div
      class="body"
      bind:this={body}
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlesFromBody}
      on:dragstart|stopPropagation={handleBodyDragStart}
      style="
				left: {100 * startingPercent}%;
				right: {100 * (1 - endingPercent)}%;
			"
    ></div>
    <div
      class="handle"
      bind:this={leftHandle}
      data-which="start"
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlePosition("start")}
      style="
				left: {100 * startingPercent}%
			"
    ></div>
    <div
      class="handle"
      data-which="end"
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlePosition("end")}
      style="
				left: {100 * endingPercent}%
			"
    ></div>
  </div>
</div>

<style>
  .double-range-container {
    width: 100%;
    height: 20px;
    user-select: none;
    box-sizing: border-box;
    white-space: nowrap;
  }
  .slider {
    position: relative;
    width: 100%;
    height: 6px;
    top: 50%;
    transform: translate(0, -50%);
    background-color: #e2e2e2;
    box-shadow:
      inset 0 7px 10px -5px #4a4a4a,
      inset 0 -1px 0px 0px #9c9c9c;
    border-radius: 1px;
  }
  .handle {
    position: absolute;
    top: 50%;
    width: 0;
    height: 0;
  }
  .handle:after {
    content: " ";
    box-sizing: border-box;
    position: absolute;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    background-color: #fdfdfd;
    border: 1px solid #7b7b7b;
    transform: translate(-50%, -50%);
  }
  /* .handle[data-which="end"]:after{
		transform: translate(-100%, -50%);
	} */
  .handle:active:after {
    background-color: #ddd;
    z-index: 9;
  }
  .body {
    top: 0;
    position: absolute;
    background-color: #34a1ff;
    bottom: 0;
  }
</style>
