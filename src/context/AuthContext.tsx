import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/api";
import { registerForPushNotifications } from "../services/pushNotifications";
import { tokenStorage } from "../services/tokenStorage";

interface User {
  id: string;
  email: string;
  pseudo: string;
  avatarUrl: string | null;
  marketingConsent: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    pseudo: string,
    marketingConsent: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = await tokenStorage.get();
      if (token) {
        try {
          const response = await api.get<User>("/users/me");
          setUser(response.data);
          registerPushSafely();
        } catch {
          await tokenStorage.remove();
        }
      }
      setIsLoading(false);
    }
    bootstrap();
  }, []);

  function registerPushSafely() {
    registerForPushNotifications().catch((error) => {
      console.log("Erreur enregistrement push token:", error);
    });
  }

  async function login(email: string, password: string) {
    const response = await api.post<{ accessToken: string }>("/auth/login", {
      email,
      password,
    });
    await tokenStorage.set(response.data.accessToken);

    const me = await api.get<User>("/users/me");
    setUser(me.data);
    registerPushSafely();
  }

  async function register(
    email: string,
    password: string,
    pseudo: string,
    marketingConsent: boolean,
  ) {
    const response = await api.post<{ accessToken: string }>("/auth/register", {
      email,
      password,
      pseudo,
      marketingConsent,
    });
    await tokenStorage.set(response.data.accessToken);

    const me = await api.get<User>("/users/me");
    setUser(me.data);
    registerPushSafely();
  }

  async function logout() {
    await tokenStorage.remove();
    setUser(null);
  }

  function updateUser(updated: User) {
    setUser(updated);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}
