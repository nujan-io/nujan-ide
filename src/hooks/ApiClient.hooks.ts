import { AppConfig } from '@/config/AppConfig';
import { notification } from 'antd';
import axios, { Axios } from 'axios';
import Router from 'next/router';

export { useApiClient };

function useApiClient() {
  return {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE'),
  };

  function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
    return (url: string, data: any = null) => {
      const finalURL =
        !url.includes('https') && !url.includes('/api')
          ? AppConfig.API_URL + url
          : url;
      const apiData: any = {
        headers: {
          ...authHeaders(finalURL),
          'Content-Type': 'application/json',
        },
      };
      if (data) {
        if (method === 'GET') {
          apiData.params = data;
        } else {
          apiData.data = data;
        }
      }

      const axiosInstance = axios.create();

      responseInterceptor(axiosInstance);

      return axiosInstance({ method, url: finalURL, ...apiData });
    };
  }

  function authHeaders(url: string) {
    // return auth header with jwt if user if logged in and request is set to api url
    const isApiUrl = url.startsWith('/api');
    const token = localStorage.getItem('ton-ide-user-token');
    if (isApiUrl && token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  async function responseInterceptor(axiosInstance: Axios) {
    axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (
          error.response &&
          error.response.status &&
          error.response.status === 401
        ) {
          if (
            error.response.data.message === 'Your token is invalid.' ||
            error.response.data.message === 'Token Expired'
          ) {
            notification.error({
              key: 'session_expired',
              message: 'Session expired',
            });
            // updateAuth(undefined);
            Router.push('/');
            return Promise.reject();
          }
        }

        return Promise.reject(error);
      },
    );
  }
}
