import React, { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.sellingPrice }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1, totalPrice: action.payload.sellingPrice }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.productId !== action.payload) };
    case 'UPDATE_QTY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity, totalPrice: quantity * i.sellingPrice } : i
        ),
      };
    }
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };
    case 'CLEAR_CART':
      return { items: [], customer: null };
    default:
      return state;
  }
};

const initialState = { items: [], customer: null };

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: product._id,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        unit: product.unit,
        gstPercent: product.gstPercent,
        discount: product.mrp - product.sellingPrice,
        categoryName: product.category?.name,
      },
    });
  }, []);

  const removeItem = useCallback((productId) => dispatch({ type: 'REMOVE_ITEM', payload: productId }), []);
  const updateQty = useCallback((productId, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { productId, quantity } }), []);
  const setCustomer = useCallback((customer) => dispatch({ type: 'SET_CUSTOMER', payload: customer }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const totals = (() => {
    const subtotal = state.items.reduce((s, i) => s + i.totalPrice, 0);
    const totalMrp = state.items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const totalDiscount = totalMrp - subtotal;
    const totalGst = state.items.reduce((s, i) => s + (i.totalPrice * i.gstPercent) / (100 + i.gstPercent), 0);
    const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, totalMrp, totalDiscount, totalGst, totalAmount: subtotal, totalItems };
  })();

  return (
    <CartContext.Provider value={{ ...state, ...totals, addItem, removeItem, updateQty, setCustomer, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
