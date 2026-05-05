import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getOutlets }   from "../services/outletService";
import { getLocations } from "../services/locationService";
import { getDivisions } from "../services/devisionService";

const extractList = (res) => {
  // Handle Promise.allSettled structure
  const data = res?.value?.data || res?.data;
  if (!data) return [];
  
  // Handle different API response structures
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.content)) return data.data.content;
  if (Array.isArray(data.content)) return data.content;
  
  return [];
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        getOutlets(0, 1000),
        getLocations(0, 1000),
        getDivisions(0, 1000),
      ]);

      const [o, l, d] = results;

      // Log failures if any
      results.forEach((res, idx) => {
        if (res.status === "rejected") {
          const names = ["Outlets", "Locations", "Divisions"];
          console.error(`❌ ${names[idx]} fetch failed:`, res.reason);
        }
      });

      return {
        outlets:   extractList(o),
        locations: extractList(l),
        divisions: extractList(d),
      };
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      return rejectWithValue(error.message);
    }
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
    addOutlet: (state, action) => {
      state.outlets.unshift(action.payload);
    },
    addLocation: (state, action) => {
      state.locations.unshift(action.payload);
    },
    addDivision: (state, action) => {
      state.divisions.unshift(action.payload);
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

export const { setDashboardData, setLoading, addOutlet, addLocation, addDivision } = dashboardSlice.actions;
export default dashboardSlice.reducer;
