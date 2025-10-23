import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authApi } from "../services/api";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: () => Promise<void>;
  logout: () => void;
  autoLogin: boolean;
  setAutoLogin: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [autoLogin, setAutoLoginState] = useState(true);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Cargar token y usuario del localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      // Verificar si el token sigue siendo válido
      verifyToken(storedToken, JSON.parse(storedUser));
    } else {
      // Si no hay token almacenado, marcar que la inicialización terminó
      setIsInitializing(false);
    }
  }, []);

  // Función para verificar si el token sigue siendo válido
  const verifyToken = async (tokenValue: string, userData: User) => {
    try {
      // Intentar hacer una llamada al backend para verificar el token
      await authApi.getProfile();
      // Si la llamada es exitosa, el token es válido
      setToken(tokenValue);
      setUser(userData);
    } catch (error) {
      console.error("Error verifying token:", error);
      // Si el token no es válido, limpiar el localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    } finally {
      // Marcar que la inicialización terminó
      setIsInitializing(false);
    }
  };

  // Auto-logout si la wallet se desconecta
  useEffect(() => {
    if (!isConnected && user && !token) {
      // Solo hacer logout si no hay token válido
      logout();
    }
  }, [isConnected, user, token]);

  // Auto-login cuando se conecta la wallet
  useEffect(() => {
    // Solo ejecutar auto-login si:
    // 1. No se está inicializando
    // 2. Está conectado y tiene dirección
    // 3. No tiene usuario o token válidos
    // 4. No está cargando
    if (
      !isInitializing &&
      isConnected &&
      address &&
      (!user?._id || !token) &&
      !isLoading
    ) {
      login();
    }
  }, [isConnected, address, user, token, isLoading, isInitializing, autoLogin]);

  const login = async () => {
    if (!address || !isConnected) {
      toast.error("Por favor conecta tu wallet primero");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Obtener nonce del servidor
      const { nonce } = await authApi.getNonce(address);

      // 2. Crear mensaje para firmar
      const message = `Bienvenido a Kanban Colaborativo!\n\nFirma este mensaje para autenticarte.\n\nWallet: ${address}\nNonce: ${nonce}`;

      // 3. Firmar mensaje con la wallet
      const signature = await signMessageAsync({ message });

      // 4. Verificar firma en el servidor
      const { token: authToken, user: userData } = await authApi.verify(
        address,
        signature,
        message
      );

      // 5. Guardar en estado y localStorage
      setToken(authToken);
      setUser(userData as User);
      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("auth_user", JSON.stringify(userData as User));

      toast.success("Autenticación exitosa!");
    } catch (error: unknown) {
      console.error("Error en login:", error);
      toast.error(
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
          "Error al autenticar"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.info("Sesión cerrada");
  };

  const setAutoLogin = (enabled: boolean) => {
    setAutoLoginState(enabled);
    localStorage.setItem("auto_login", enabled.toString());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isInitializing,
        login,
        logout,
        autoLogin,
        setAutoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
