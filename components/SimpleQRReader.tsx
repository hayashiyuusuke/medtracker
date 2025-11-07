'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface SimpleQRReaderProps {
  onResult: (data: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  autoStart?: boolean;  // 自動起動オプションを追加
}

export default function SimpleQRReader({ onResult, onError, className, autoStart = false }: SimpleQRReaderProps) {
  const [isScanning, setIsScanning] = useState(autoStart);  // autoStartがtrueなら最初からスキャン開始
  const [error, setError] = useState<string>('');

  const handleScan = (result: any) => {
    console.log('QR Scanner handleScan called:', result);
    
    if (result && result.length > 0) {
      console.log('結果の詳細:', result);
      
      const firstResult = result[0];
      console.log('最初の結果:', firstResult);
      
      if (firstResult?.rawValue) {
        const data = firstResult.rawValue;
        console.log('QR Code scanned successfully:', data.substring(0, 100) + '...');
        console.log('データ長:', data.length);
        
        onResult(data);
        setIsScanning(false);
      } else {
        console.log('❌ rawValueが存在しません:', firstResult);
        setError('QRコードデータの読み取りに失敗しました');
      }
    } else {
      console.log('❌ 結果が空または無効です:', result);
      setError('QRコードが検出されませんでした');
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    let errorMessage = 'スキャンエラーが発生しました';
    
    if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission denied')) {
      errorMessage = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラのアクセスを許可してください。';
    } else if (error?.name === 'NotFoundError' || error?.message?.includes('No camera')) {
      errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
    } else if (error?.name === 'NotSupportedError') {
      errorMessage = 'このブラウザではQRコードスキャンがサポートされていません。';
    } else if (error?.message?.includes('not available')) {
      errorMessage = 'カメラが利用できません。他のアプリでカメラが使用されていないか確認してください。';
    }
    
    setError(errorMessage);
    if (onError) onError(error);
  };

  const startScanning = () => {
    setError('');
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* autoStartがfalseの場合のみボタンを表示 */}
      {!autoStart && (
        <div className="flex gap-2">
          <button
            onClick={startScanning}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-500 text-gray-900 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isScanning ? 'スキャン中...' : 'QRコードをスキャン'}
          </button>
          
          {isScanning && (
            <button
              onClick={stopScanning}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              停止
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isScanning && (
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <Scanner
            onScan={handleScan}
            onError={handleError}
            allowMultiple={false}
            scanDelay={300}
            constraints={{
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }}
            components={{
              finder: true
            }}
            styles={{
              container: {
                width: '100%',
                maxWidth: '500px',
                height: '300px'
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
