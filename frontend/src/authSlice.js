// Google OAuth async thunk
export const googleAuth = (credentialResponse) => async dispatch => {
  dispatch(authStart());
  try {
    // Decode JWT from Google (credentialResponse.credential)
    const base64Url = credentialResponse.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { email, sub: googleId } = JSON.parse(jsonPayload);

    const res = await fetch('http://localhost:5000/api/v1/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, googleId }),
    });

    const data = await res.json();
    if (res.ok) {
      dispatch(authSuccess(data));
    } else {
      dispatch(authFailure(data.message || 'Google authentication failed'));
    }
  } catch (err) {
    dispatch(authFailure('Google authentication error'));
  }
};


import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('jwtToken') || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.loading = true;
      state.error = null;
    },
    authSuccess(state, action) {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('jwtToken', action.payload.token);
    },
    authFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('jwtToken');
    },
  },
});


export const { authStart, authSuccess, authFailure, logout } = authSlice.actions;

// Async actions
export const loginUser = (email, password) => async dispatch => {
  dispatch(authStart());
  try {
    const res = await fetch('http://localhost:5000/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      dispatch(authSuccess(data));
    } else {
      dispatch(authFailure(data.message || 'Login failed'));
    }
  } catch (err) {
    dispatch(authFailure('Network error'));
  }
};

export const registerUser = (email, password) => async dispatch => {
  dispatch(authStart());
  try {
    const res = await fetch('http://localhost:5000/api/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    if (res.ok) {
      dispatch(authSuccess(data));
    } else {
      dispatch(authFailure(data.message || 'Register failed'));
    }
  } catch (err) {
    dispatch(authFailure('Network error'));
  }
};

export default authSlice.reducer;
