import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,      // البيانات صالحة 5 دقائق
			gcTime: 1000 * 60 * 10,        // تبقى في الذاكرة 10 دقائق
			refetchOnMount: false,          // لا تُعيد الجلب عند كل mount
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});