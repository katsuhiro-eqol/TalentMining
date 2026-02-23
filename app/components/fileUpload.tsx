'use client';
import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useDropzone } from 'react-dropzone';
//import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FileText, Image, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FILE } from "@/types"

interface FileUploadProps {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
}


export default function FileUploadPage2({files, setFiles}:FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 

  // ファイルサイズをフォーマットする関数
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    else return (size / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ドロップゾーンの設定
  const onDrop = useCallback((acceptedFiles:File[]) => {
    // 既存のファイルと新しいファイルを結合
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : ""
      })
    );
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  // ファイルタイプの制限
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxSize: 1 * 1024 * 1024
  });

  
  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // ファイルをアップロードする処理
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadStatus(null);
    
  };

  const uploadfiles = () => {

  }

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-3 mb-3 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 py-3">
        <p className="text-gray-600 text-sm">ここにファイルをドロップしてください（最大5ファイルまで）</p>
        <p className="text-xs text-gray-500">対応ファイル: .txt</p>
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-red-600 font-medium mb-2 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            アップロードできないファイル
          </h3>
          <ul className="text-sm text-red-500 list-disc pl-5">
            {fileRejections.map(({ file, errors }, index) => (
              <li key={index}>
                {file.name} ({formatFileSize(file.size)}): 
                {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      

        <div className="p-1 text-xs">
          アップロード済みファイル：
          {files.map((file, index) => {
            return (
            <span className="ml-2 bg-green-100 rounded-lg text-center text-xs inline-flex items-center gap-1" key={index}>
              {file.name}
              <X size={14} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => removeFile(index)} />
            </span>)
          })
        }
        </div>


    </div>
  );
}

/*

          {isDragActive ? (
            <div>
            <p className="text-blue-500 text-sm">ここにファイルをドロップしてください</p>
            <p className="text-xs text-gray-500">対応ファイル: .txt</p>
            </div>

          ) : (
            <>
              <p className="text-gray-600 text-sm">ここにファイルをドロップしてください</p>
              <p className="text-xs text-gray-500">対応ファイル: .txt</p>
            </>
          )}


        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {files.map((file, index) => {
            return (
            <div className="bg-green-100 p-1 rounded-lg text-center text-xs" key={index}>
              {file.name}
            </div>)
          })
        }
        </div>
        */