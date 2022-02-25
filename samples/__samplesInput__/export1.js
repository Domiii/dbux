/**
 * @file
 * Export statement samples, based on redux-toolkit code.
 */

export const counterSlice = {
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload
    },
  },
};

export const { increment, decrement, incrementByAmount } = counterSlice.reducers

console.log('hi');

export const incrementAsync = (amount) => (dispatch) => {
  setTimeout(() => {
    dispatch(incrementByAmount(amount))
  }, 1000)
}

export const selectCount = (state) => state.counter.value

export default counterSlice.reducer

export const x = 1;