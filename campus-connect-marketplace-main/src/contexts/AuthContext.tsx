import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, mockUsers } from '@/lib/mockData';
import { apiUrl } from '@/lib/api';
import i18n from '@/i18n';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Omit<Partial<User>, "profile_picture"> & { profile_picture?: File | string }) => Promise<boolean>;
  getUniversityOptions: (universityId?: number) => Promise<UniversityOptionsResponseBody>;
  updateUniversitySettings: (data: { university_id: number; dormitory_id: number }) => Promise<boolean>;
  getMetaOptions: () => Promise<MetaOptionsResponseBody>;
  getDormitoriesByUniversity: () => Promise<DormitoriesByUniversityResponseBody>;
  getMyProductCards: (params?: { page?: number; page_size?: number }) => Promise<MyProductCardsResponseBody>;
  createProduct: (data: CreateProductInput) => Promise<CreateProductResponseBody>;
  getProductForEdit: (productId: number) => Promise<GetProductForEditResponseBody>;
  updateProduct: (productId: number, data: UpdateProductInput) => Promise<UpdateProductResponseBody>;
  markProductSold: (productId: number) => Promise<MarkProductSoldResponseBody>;
}

interface SignupData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  dormitory_id?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type LoginResponse = {
  message?: string;
  access_token?: string;
  token_type?: string;
};

type UpdateProfileResponse = {
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
};

type UserLanguageResponse = {
  message?: string;
  language?: string;
};

type UserProfilePictureResponse = {
  message?: string;
  profile_picture?: string | null;
};

type UniversityOption = {
  id: number;
  name: string;
};

type DormitoryOption = {
  id: number;
  dormitory_name: string;
  is_active?: boolean;
  university_id?: number;
};

type UniversityOptionsResponseBody = {
  message?: string;
  current?: { university_id?: number | null; dormitory_id?: number | null };
  universities?: UniversityOption[];
  dormitories?: DormitoryOption[];
  errors?: Record<string, string[]>;
};

type UpdateUniversitySettingsResponseBody = {
  message?: string;
  user?: { id: number; dormitory_id?: number | null };
  university?: UniversityOption;
  dormitory?: DormitoryOption;
  errors?: Record<string, string[]>;
};

type MetaCategoryOption = {
  id: number;
  name: string;
  icon?: string | null;
};

type MetaConditionLevelOption = {
  id: number;
  name: string;
  description?: string | null;
  sort_order?: number | null;
};

type MetaTagOption = {
  id: number;
  name: string;
};

type MetaOptionsResponseBody = {
  message?: string;
  categories?: MetaCategoryOption[];
  condition_levels?: MetaConditionLevelOption[];
  tags?: MetaTagOption[];
  errors?: Record<string, string[]>;
};

type MyProductCard = {
  id: number;
  title: string;
  price: number;
  status: "available" | "sold" | "reserved";
  created_at: string;
  image_thumbnail_url?: string | null;
  dormitory?: DormitoryOption & { university_id?: number };
  category?: { id: number; name: string; parent_id?: number | null };
  condition_level?: MetaConditionLevelOption;
};

type MyProductCardsResponseBody = {
  message?: string;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  products?: MyProductCard[];
  errors?: Record<string, string[]>;
};

type DormitoriesByUniversityResponseBody = {
  message?: string;
  university_id?: number;
  dormitories?: DormitoryOption[];
  errors?: Record<string, string[]>;
};

type CreateProductInput = {
  category_id: number;
  condition_level_id: number;
  title: string;
  description?: string | null;
  price: number;
  dormitory_id?: number | null;
  tag_ids?: number[] | null;
  primary_image_index?: number | null;
  images?: File[] | null;
  image_urls?: string[] | null;
};

type CreateProductResponseBody = {
  message?: string;
  product?: unknown;
  images?: unknown[];
  tag_ids?: number[];
  errors?: Record<string, string[]>;
};

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  image_thumbnail_url?: string | null;
  is_primary: boolean;
};

type EditableProduct = {
  id: number;
  seller_id?: number;
  dormitory_id?: number | null;
  dormitory?: DormitoryOption;
  category_id: number;
  category?: MetaCategoryOption & { parent_id?: number | null };
  condition_level_id: number;
  condition_level?: MetaConditionLevelOption;
  title: string;
  description?: string | null;
  price: number;
  status: "available" | "sold" | "reserved";
  created_at?: string;
  images?: ProductImage[];
  tags?: MetaTagOption[];
  tag_ids?: number[];
};

type GetProductForEditResponseBody = {
  message?: string;
  product?: EditableProduct;
  errors?: Record<string, string[]>;
};

type UpdateProductInput = {
  title: string;
  description?: string | null;
  price: number;
  category_id: number;
  condition_level_id: number;
  dormitory_id?: number | null;
  tag_ids?: number[] | null;
};

type UpdateProductResponseBody = {
  message?: string;
  product?: EditableProduct;
  errors?: Record<string, string[]>;
};

type MarkProductSoldResponseBody = {
  message?: string;
  product?: { id: number; status: "sold" | "available" | "reserved" };
  errors?: Record<string, string[]>;
};

const STORAGE_KEYS = {
  accessToken: "auth.access_token",
  tokenType: "auth.token_type",
  user: "auth.user",
} as const;

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const removeStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
};

const deriveUserFromEmail = (email: string, role: User["role"]): User => {
  const identifier = (email.split("@")[0] || email).trim() || "user";
  return {
    id: 0,
    full_name: identifier,
    username: identifier,
    email,
    role,
    status: "active",
  };
};

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const removeUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> => {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => readStorage(STORAGE_KEYS.accessToken));
  const [tokenType, setTokenType] = useState<string | null>(() => readStorage(STORAGE_KEYS.tokenType));
  const [user, setUser] = useState<User | null>(() => parseJson<User>(readStorage(STORAGE_KEYS.user)));

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language]);

  const fetchUserLanguage = useCallback(async () => {
    if (!accessToken) return;
    if (user?.role === 'admin') return;

    const response = await fetch(apiUrl("/api/user/settings/language"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UserLanguageResponse)
      : null;

    if (!response.ok) return;

    const supported = i18n.options.supportedLngs;
    const nextLanguage = responseBody?.language || "en";
    if (Array.isArray(supported) && supported.length > 0 && !supported.includes(nextLanguage)) return;

    if (i18n.resolvedLanguage !== nextLanguage) {
      await i18n.changeLanguage(nextLanguage);
    }

    setUser(prev => {
      if (!prev) return prev;
      if (prev.language === nextLanguage) return prev;
      const nextUser = { ...prev, language: nextLanguage };
      writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      return nextUser;
    });
  }, [accessToken, tokenType, user?.role]);

  useEffect(() => {
    void fetchUserLanguage();
  }, [fetchUserLanguage]);

  const fetchUserProfilePicture = useCallback(async () => {
    if (!accessToken) return;
    if (user?.role === 'admin') return;

    const response = await fetch(apiUrl("/api/user/settings/profile-picture"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UserProfilePictureResponse)
      : null;

    if (!response.ok) return;

    const nextProfilePicture = responseBody?.profile_picture ?? undefined;

    setUser(prev => {
      if (!prev) return prev;
      if (prev.profile_picture === nextProfilePicture) return prev;
      const nextUser = { ...prev, profile_picture: nextProfilePicture };
      writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      return nextUser;
    });
  }, [accessToken, tokenType, user?.role]);

  useEffect(() => {
    void fetchUserProfilePicture();
  }, [fetchUserProfilePicture]);

  const setAuthSession = useCallback((nextUser: User, nextToken: string, nextTokenType: string) => {
    setUser(nextUser);
    setAccessToken(nextToken);
    setTokenType(nextTokenType);
    writeStorage(STORAGE_KEYS.accessToken, nextToken);
    writeStorage(STORAGE_KEYS.tokenType, nextTokenType);
    writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
  }, []);

  const loginWithEndpoint = useCallback(
    async (endpoint: string, email: string, password: string, role: User["role"]): Promise<boolean> => {
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as LoginResponse;
      const token = data.access_token;
      if (!token) return false;

      const nextTokenType = data.token_type || "Bearer";
      setAuthSession(deriveUserFromEmail(email, role), token, nextTokenType);
      return true;
    },
    [setAuthSession],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/user/login", email, password, "user");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/admin/login", email, password, "admin");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: mockUsers.length + 1,
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone_number: data.phone_number,
      dormitory_id: data.dormitory_id,
      role: 'user',
      status: 'active',
    };
    
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setTokenType(null);
    removeStorage(STORAGE_KEYS.accessToken);
    removeStorage(STORAGE_KEYS.tokenType);
    removeStorage(STORAGE_KEYS.user);
  }, []);

  const updateProfile = useCallback(async (data: Omit<Partial<User>, "profile_picture"> & { profile_picture?: File | string }): Promise<boolean> => {
    if (!accessToken) return false;

    const hasFile = typeof data.profile_picture !== "string" && data.profile_picture instanceof File;
    const payload = removeUndefined({
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone_number: data.phone_number,
      dormitory_id: data.dormitory_id,
      profile_picture: hasFile ? undefined : data.profile_picture,
      student_id: data.student_id,
      bio: data.bio,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      language: data.language,
      timezone: data.timezone,
    });

    const response = await fetch(apiUrl("/api/user/settings"), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        ...(hasFile ? {} : { "Content-Type": "application/json" }),
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
      body: hasFile
        ? (() => {
            const form = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              if (typeof value === "number") {
                form.set(key, String(value));
                return;
              }
              form.set(key, String(value));
            });
            form.append("profile_picture", data.profile_picture as File);
            return form;
          })()
        : JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UpdateProfileResponse)
      : null;

    if (response.status === 422 && responseBody?.errors) {
      throw responseBody;
    }

    if (!response.ok) return false;

    const updatedUser = responseBody?.user;
    if (updatedUser) {
      setUser(updatedUser);
      writeStorage(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    }

    return true;
  }, [accessToken, tokenType]);

  const getUniversityOptions = useCallback(
    async (universityId?: number): Promise<UniversityOptionsResponseBody> => {
      if (!accessToken) {
        return { message: "Unauthenticated." };
      }

      const url = new URL(apiUrl("/api/user/settings/university-options"));
      if (typeof universityId === "number" && Number.isFinite(universityId)) {
        url.searchParams.set("university_id", String(universityId));
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UniversityOptionsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) {
          throw responseBody;
        }
        if (response.status === 401) {
          throw responseBody;
        }
        if (response.status === 403) {
          throw responseBody;
        }
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) {
        throw { message: "Unauthenticated." } as UniversityOptionsResponseBody;
      }
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UniversityOptionsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType],
  );

  const updateUniversitySettings = useCallback(
    async (data: { university_id: number; dormitory_id: number }): Promise<boolean> => {
      if (!accessToken) return false;

      const response = await fetch(apiUrl("/api/user/settings/university"), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UpdateUniversitySettingsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) {
          throw responseBody;
        }
        if (response.status === 401) {
          throw responseBody;
        }
        if (response.status === 403) {
          throw responseBody;
        }
        if (response.status === 404) {
          throw responseBody;
        }
      }

      if (response.status === 401) {
        throw { message: "Unauthenticated." } as UpdateUniversitySettingsResponseBody;
      }
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateUniversitySettingsResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Dormitory not found for the selected university." } as UpdateUniversitySettingsResponseBody;
      }
      if (!response.ok) return false;

      const nextDormitoryId = responseBody?.user?.dormitory_id ?? undefined;
      if (user && typeof nextDormitoryId === "number") {
        const nextUser = { ...user, dormitory_id: nextDormitoryId };
        setUser(nextUser);
        writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      }

      return true;
    },
    [accessToken, tokenType, user],
  );

  const createProduct = useCallback(
    async (data: CreateProductInput): Promise<CreateProductResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreateProductResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateProductResponseBody;
      }

      const hasFiles = (data.images?.length || 0) > 0;
      const url = apiUrl("/api/user/products");

      const response = await fetch(url, {
        method: "POST",
        headers: hasFiles
          ? {
              Accept: "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            },
        body: hasFiles
          ? (() => {
              const form = new FormData();
              form.set("category_id", String(data.category_id));
              form.set("condition_level_id", String(data.condition_level_id));
              form.set("title", data.title);
              form.set("price", String(data.price));
              if (data.description) form.set("description", data.description);
              if (typeof data.dormitory_id === "number") form.set("dormitory_id", String(data.dormitory_id));
              if (typeof data.primary_image_index === "number") {
                form.set("primary_image_index", String(data.primary_image_index));
              }
              if (Array.isArray(data.tag_ids)) {
                data.tag_ids.forEach((id) => form.append("tag_ids[]", String(id)));
              }
              if (Array.isArray(data.image_urls)) {
                data.image_urls.forEach((imageUrl) => form.append("image_urls[]", imageUrl));
              }
              (data.images || []).forEach((file) => form.append("images[]", file));
              return form;
            })()
          : JSON.stringify(
              removeUndefined({
                category_id: data.category_id,
                condition_level_id: data.condition_level_id,
                title: data.title,
                description: data.description || undefined,
                price: data.price,
                dormitory_id: typeof data.dormitory_id === "number" ? data.dormitory_id : undefined,
                tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : undefined,
                primary_image_index:
                  typeof data.primary_image_index === "number" ? data.primary_image_index : undefined,
                image_urls: Array.isArray(data.image_urls) ? data.image_urls : undefined,
              }),
            ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreateProductResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreateProductResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateProductResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getMetaOptions = useCallback(async (): Promise<MetaOptionsResponseBody> => {
    if (!accessToken) {
      throw { message: "Unauthenticated." } as MetaOptionsResponseBody;
    }
    if (user?.role && user.role !== "user") {
      throw { message: "Unauthorized: Only users can access this endpoint." } as MetaOptionsResponseBody;
    }

    const response = await fetch(apiUrl("/api/user/meta/options"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as MetaOptionsResponseBody)
      : null;

    if (responseBody) {
      if (response.status === 401) throw responseBody;
      if (response.status === 403) throw responseBody;
      if (!response.ok) return responseBody;
      return responseBody;
    }

    if (response.status === 401) throw { message: "Unauthenticated." } as MetaOptionsResponseBody;
    if (response.status === 403) {
      throw { message: "Unauthorized: Only users can access this endpoint." } as MetaOptionsResponseBody;
    }
    return { message: "Request failed" };
  }, [accessToken, tokenType, user]);

  const getMyProductCards = useCallback(
    async (params?: { page?: number; page_size?: number }): Promise<MyProductCardsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MyProductCardsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MyProductCardsResponseBody;
      }

      const url = new URL(apiUrl("/api/user/products/cards"));
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        url.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        url.searchParams.set("page_size", String(params.page_size));
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MyProductCardsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MyProductCardsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MyProductCardsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getProductForEdit = useCallback(
    async (productId: number): Promise<GetProductForEditResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as GetProductForEditResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as GetProductForEditResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/products/${productId}/edit`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as GetProductForEditResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as GetProductForEditResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as GetProductForEditResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as GetProductForEditResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const updateProduct = useCallback(
    async (productId: number, data: UpdateProductInput): Promise<UpdateProductResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as UpdateProductResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateProductResponseBody;
      }

      const payload = removeUndefined({
        title: data.title,
        description: data.description ?? null,
        price: data.price,
        category_id: data.category_id,
        condition_level_id: data.condition_level_id,
        dormitory_id: data.dormitory_id ?? null,
        tag_ids: data.tag_ids ?? null,
      });

      const response = await fetch(apiUrl(`/api/user/products/${productId}`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UpdateProductResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as UpdateProductResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateProductResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as UpdateProductResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const markProductSold = useCallback(
    async (productId: number): Promise<MarkProductSoldResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MarkProductSoldResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MarkProductSoldResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/products/${productId}/mark-sold`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MarkProductSoldResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MarkProductSoldResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MarkProductSoldResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as MarkProductSoldResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getDormitoriesByUniversity = useCallback(async (): Promise<DormitoriesByUniversityResponseBody> => {
    if (!accessToken) {
      throw { message: "Unauthenticated." } as DormitoriesByUniversityResponseBody;
    }
    if (user?.role && user.role !== "user") {
      throw { message: "Unauthorized: Only users can access this endpoint." } as DormitoriesByUniversityResponseBody;
    }

    const response = await fetch(apiUrl("/api/user/meta/dormitories/by-university"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as DormitoriesByUniversityResponseBody)
      : null;

    if (responseBody) {
      if (response.status === 401) throw responseBody;
      if (response.status === 403) throw responseBody;
      if (response.status === 404) throw responseBody;
      if (!response.ok) return responseBody;
      return responseBody;
    }

    if (response.status === 401) throw { message: "Unauthenticated." } as DormitoriesByUniversityResponseBody;
    if (response.status === 403) {
      throw { message: "Unauthorized: Only users can access this endpoint." } as DormitoriesByUniversityResponseBody;
    }
    if (response.status === 404) {
      throw { message: "Dormitory not found for the user." } as DormitoriesByUniversityResponseBody;
    }
    return { message: "Request failed" };
  }, [accessToken, tokenType, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!accessToken,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        signup,
        logout,
        updateProfile,
        getUniversityOptions,
        updateUniversitySettings,
        getMetaOptions,
        getDormitoriesByUniversity,
        getMyProductCards,
        createProduct,
        getProductForEdit,
        updateProduct,
        markProductSold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
