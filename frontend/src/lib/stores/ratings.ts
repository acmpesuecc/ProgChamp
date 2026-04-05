import { writable } from 'svelte/store';

type RatingData = {
  totalRatings: number;
  totalScore: number;
  superlikes: number;
};

export const ratings = writable<Record<string, RatingData>>({});
