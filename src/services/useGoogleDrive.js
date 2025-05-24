import { useState } from "react";

export const useGoogleDrive = ({ apiKey, clientId, folderId }) => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const initClient = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('client:auth2:picker', {
          callback: () => {
            window.gapi.client.init({
              apiKey: apiKey,
              clientId: clientId,
              scope: 'https://www.googleapis.com/auth/drive.file',
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            }).then(() => {
              // Listen for sign-in state changes
              window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
              // Set the initial sign-in state
              setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
              setGapiLoaded(true);
              resolve();
            }).catch(error => {
              console.error('Error initializing Google API client:', error);
              reject(error);
            });
          },
          onerror: () => {
            console.error('Failed to load Google API client');
            reject(new Error('Failed to load Google API client'));
          },
          timeout: 5000 // 5 seconds timeout
        });
      };
      script.onerror = () => {
        console.error('Failed to load Google API script');
        reject(new Error('Failed to load Google API script'));
      };
      document.body.appendChild(script);
    });
  };

  const authenticate = async () => {
    if (!window.gapi || !window.gapi.auth2) {
      await initClient();
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    return authInstance.currentUser.get().getAuthResponse().access_token;
  };

  const pickAndUploadFile = async () => {
    try {
      if (!window.gapi || !window.google) {
        await initClient();
      }

      // Ensure we're authenticated before proceeding
      const token = await authenticate();
      
      return new Promise((resolve) => {
        const picker = new window.google.picker.PickerBuilder()
          .addView(new window.google.picker.DocsUploadView().setIncludeFolders(true))
          .setOAuthToken(token)
          .setDeveloperKey(apiKey)
          .setCallback((data) => {
            if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
              const file = data[window.google.picker.Response.DOCUMENTS][0];
              resolve({
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.sizeBytes,
                webViewLink: file.url,
                description: 'Uploaded via Google Picker'
              });
            }
          })
          .build();
        
        picker.setVisible(true);
      });
    } catch (error) {
      console.error("Error in pickAndUploadFile:", error);
      throw error;
    }
  };

  const listFiles = async () => {
    try {
      if (!window.gapi || !gapiLoaded) {
        await initClient();
      }

      const token = await authenticate();
      window.gapi.client.setToken({ access_token: token });

      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime)',
        orderBy: 'createdTime desc'
      });
      return response.result.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.mimeType,
        size: parseInt(file.size || '0'),
        webViewLink: file.webViewLink,
        createdAt: file.createdTime,
        updatedAt: file.modifiedTime
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  };

  const deleteFile = async (fileId) => {
    try {
      if (!window.gapi || !gapiLoaded) {
        await initClient();
      }

      const token = await authenticate();
      window.gapi.client.setToken({ access_token: token });

      await window.gapi.client.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  return {
    initClient,
    pickAndUploadFile,
    listFiles,
    deleteFile,
    gapiLoaded,
    isSignedIn
  };
};