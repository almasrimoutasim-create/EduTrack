/**
 * Mock file upload client to replace base44.integrations.Core.UploadFile.
 * This simulates uploading a file and returning a URL by creating a local blob URL.
 * In a production environment, this should be replaced with a real fetch request to your backend (e.g. S3).
 */

export const fileClient = {
  /**
   * Mocks file uploading and returns a blob URL representing the file.
   * @param {Object} param0 - The options object containing the file to upload.
   * @param {File} param0.file - The file object from an input element.
   * @returns {Promise<{file_url: string}>}
   */
  uploadFile: async ({ file }) => {
    if (!file) throw new Error("No file provided for upload");
    
    return new Promise((resolve) => {
      // Simulate network delay of an upload
      setTimeout(() => {
        const file_url = URL.createObjectURL(file);
        resolve({ file_url });
      }, 800);
    });
  },

  /**
   * Mocks extracting data from an uploaded Excel/CSV file to replace base44.integrations.Core.ExtractDataFromUploadedFile.
   * @param {Object} param0
   * @param {string} param0.file_url - The URL of the uploaded file.
   * @param {string} param0.format - The expected format of the data to extract.
   * @returns {Promise<{status: string, output: any}>}
   */
  extractDataFromUploadedFile: async ({ file_url, format }) => {
    return new Promise((resolve) => {
      // Simulate backend processing time
      setTimeout(() => {
        resolve({
          status: "completed",
          output: {
            // Provide a mock structure depending on the expected format
            // In a real scenario, the backend parses the Excel file and returns the rows.
            rows: [
              { "Student Name": "أحمد علي", "Grade": "10", "Parent Phone": "0501234567" },
              { "Student Name": "سارة عمر", "Grade": "9", "Parent Phone": "0507654321" },
              { "Student Name": "محمد خالد", "Grade": "12", "Parent Phone": "0509998888" },
            ]
          }
        });
      }, 1500);
    });
  }
};

export default fileClient;
