import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productFinded = updatedCart.find(product => product.id === productId);

      const response = await api.get(`/stock/${productId}`);
      const stock: Stock = response.data;
      const productAmount = productFinded ? productFinded.amount : 0;
      const amount = productAmount + 1;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productFinded) {
        productFinded.amount = amount
      } else {
        const response = await api.get(`products/${productId}`);
        const product: Product = response.data;

        const newProduct = {
          ...product,
          amount: 1
        }
        updatedCart.push(newProduct);
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productFinded = cart.find(product => product.id === productId);

      if (!productFinded) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const updatedCart = cart.filter(product => product.id !== productId);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {      
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const updatedCart = [...cart]
      const productFinded = updatedCart.find(product => product.id === productId);

      if (!productFinded){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      } else {

        const response = await api.get(`/stock/${productId}`);
        const stock: Stock = response.data;

        if (amount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productFinded.amount = amount;
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
