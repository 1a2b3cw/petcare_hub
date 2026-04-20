"use client";

import { create } from "zustand";

type AppointmentFilterState = {
  status: string;
  keyword: string;
  setStatus: (status: string) => void;
  setKeyword: (keyword: string) => void;
  reset: () => void;
};

const initialState = {
  status: "ALL",
  keyword: "",
};

export const useAppointmentFilterStore = create<AppointmentFilterState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setKeyword: (keyword) => set({ keyword }),
  reset: () => set(initialState),
}));
