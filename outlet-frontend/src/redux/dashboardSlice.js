import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getOutlets }   from "../services/outletService";
import { getLocations } from "../services/locationService";
import { getDivisions } from "../services/devisionService";

const extractList = (res) => res?.value?.data?.data?.content || [];

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchAll",
  async () => {
    const [o, l, d] = await Promise.allSettled([
      getOutlets(),
      getLocations(),
      getDivisions(),
    ]);
    return {
      outlets:   extractList(o),
      locations: extractList(l),
      divisions: extractList(d),
    };
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    outlets:   [],
    locations: [],
    divisions: [],
    loading:   true,
  },
  reducers: {
    setDashboardData: (state, action) => {
      state.outlets   = action.payload.outlets;
      state.locations = action.payload.locations;
      state.divisions = action.payload.divisions;
      state.loading   = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.outlets   = action.payload.outlets;
        state.locations = action.payload.locations;
        state.divisions = action.payload.divisions;
        state.loading   = false;
      });
  },
});

export const { setDashboardData, setLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;
