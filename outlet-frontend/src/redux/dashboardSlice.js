import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    outlets: [],
    locations: [],
    divisions: [],
    loading: true
  },
  reducers: {
    setDashboardData: (state, action) => {
      state.outlets = action.payload.outlets;
      state.locations = action.payload.locations;
      state.divisions = action.payload.divisions;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setDashboardData, setLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;