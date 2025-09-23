'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface QRCodeReaderProps {
  onSuccess: (data: string) => void;
  onClose: () => void;
}

const QRCodeReader: React.FC<QRCodeReaderProps> = ({ onSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [reader, setReader] = useState<BrowserMultiFormatReader | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [isOptimizedMode, setIsOptimizedMode] = useState(true); // 負荷軽減モード
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('QRCodeReader コンポーネントが読み込まれました');
  console.log('QRCodeReader レンダリング開始');

  useEffect(() => {
    console.log('QRCodeReader useEffect - 初期化開始');
    
    // モーダル表示時のスクロール設定は削除
    
    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        console.log('カメラの初期化開始');
        
        // カメラアクセス許可を明示的に要求
        console.log('カメラアクセス許可を要求中...');
        await navigator.mediaDevices.getUserMedia({ 
          video: isOptimizedMode ? {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: { ideal: 'environment' },
            frameRate: { ideal: 15, min: 10 }
          } : {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: { ideal: 'environment' },
            frameRate: { ideal: 30, min: 15 }
          }
        });
        console.log('カメラアクセス許可が得られました');
        
        // 負荷軽減モードでのヒント設定
        const hints = new Map();
        if (isOptimizedMode) {
          hints.set(DecodeHintType.TRY_HARDER, false); // 高精度モードを無効
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]); // QRコードのみ
        } else {
          hints.set(DecodeHintType.TRY_HARDER, true);
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.AZTEC,
            BarcodeFormat.PDF_417
          ]);
        }
        hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
        
        const codeReader = new BrowserMultiFormatReader(hints);
        setReader(codeReader);
        
        // まず標準APIでデバイスを取得
        console.log('標準API でデバイス検出開始');
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        console.log('標準API で検出されたビデオデバイス:', videoDevices);
        
        // ZXingライブラリでもデバイス検出を試行
        console.log('ZXing ライブラリでデバイス検出開始');
        const zxingDevices = await codeReader.listVideoInputDevices();
        console.log('ZXing で検出されたデバイス:', zxingDevices);
        console.log('最初のZXingデバイス詳細:', zxingDevices[0]);
        
        // より多くのデバイスが検出された方を使用
        const devicesToUse = zxingDevices.length >= videoDevices.length ? zxingDevices : videoDevices;
        setDevices(devicesToUse);
        
        if (devicesToUse.length > 0) {
          const firstDevice = devicesToUse[0];
          const defaultDeviceId = firstDevice.deviceId;
          console.log('使用するデバイス:', firstDevice);
          console.log('deviceId:', defaultDeviceId);
          console.log('label:', firstDevice.label);
          
          setSelectedDeviceId(defaultDeviceId);
          console.log('デフォルトデバイス設定:', defaultDeviceId);
          console.log('利用可能なデバイス:', devicesToUse.map(d => ({ id: d.deviceId, label: d.label })));
        } else {
          console.log('カメラデバイスが見つかりませんでした');
        }
        
        setIsLoading(false);
        console.log('カメラ初期化完了');
      } catch (err) {
        console.error('カメラ初期化エラー:', err);
        setError('カメラの初期化に失敗しました');
        setIsLoading(false);
      }
    };

    initializeCamera();

    return () => {
      if (reader) {
        console.log('QRCodeReader クリーンアップ');
        reader.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    console.log('スキャン開始ボタンクリック');
    console.log('reader:', !!reader);
    console.log('videoRef.current:', !!videoRef.current);
    console.log('selectedDeviceId:', selectedDeviceId);
    
    if (!reader || !videoRef.current || !selectedDeviceId) {
      console.log('スキャン開始失敗 - 必要な要素が不足');
      return;
    }

    try {
      console.log('QRコードスキャン開始:', selectedDeviceId);
      setIsScanning(true);
      setError(null);
      setScanAttempts(0);

      // ビデオ要素をリセット
      const video = videoRef.current;
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }

      // シンプルなスキャン処理（負荷軽減版）
      console.log('ZXingライブラリでスキャン開始 - 最適化モード:', isOptimizedMode);
      
      if (isOptimizedMode) {
        // 負荷軽減モード: 間隔を空けてスキャン
        const intervalScan = () => {
          reader.decodeOnceFromVideoDevice(selectedDeviceId, video)
            .then(result => {
              if (result) {
                console.log('✅ QRコード読み取り成功:', result.getText());
                console.log('読み取り形式:', result.getBarcodeFormat());
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current);
                }
                reader.reset();
                onSuccess(result.getText());
                setIsScanning(false);
              } else {
                setScanAttempts(prev => prev + 1);
              }
            })
            .catch(error => {
              if (!(error instanceof NotFoundException)) {
                console.error('⚠️ QRコード読み取りエラー:', error);
              }
              setScanAttempts(prev => prev + 1);
            });
        };
        
        // 500ms間隔でスキャン（負荷軽減）
        scanIntervalRef.current = setInterval(intervalScan, 500);
        
      } else {
        // 高負荷モード: 連続スキャン
        reader.decodeFromVideoDevice(selectedDeviceId, video, (result, error) => {
          if (result) {
            console.log('✅ QRコード読み取り成功:', result.getText());
            console.log('読み取り形式:', result.getBarcodeFormat());
            reader.reset();
            onSuccess(result.getText());
            setIsScanning(false);
            return;
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('⚠️ QRコード読み取りエラー:', error);
          }
          
          // 試行回数を更新（UIに表示するため）
          setScanAttempts(prev => prev + 1);
        });
      }
      
    } catch (err) {
      console.error('❌ QRコード読み取りエラー:', err);
      setError('QRコードの読み取りに失敗しました');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('QRコードスキャン停止');
    
    // インターバルをクリア
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (reader) {
      reader.reset();
    }
    
    // ビデオストリームを停止
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('ビデオトラック停止:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleClose = () => {
    console.log('QRCodeReader 閉じる');
    stopScanning();
    onClose();
  };

  console.log('QRCodeReader return直前 - モーダルをレンダリング中');

  return (
    <div 
      className="fixed"
      style={{ 
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '50px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        // オーバーレイクリックで閉じる
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg" 
        style={{ 
          width: '90%',
          maxWidth: '500px',
          zIndex: 10000,
          backgroundColor: 'white',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">QRコード読み取り</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {(() => {
          console.log('レンダリング状態:', { 
            isLoading, 
            devicesLength: devices.length, 
            selectedDeviceId, 
            isScanning,
            selectedDeviceIdType: typeof selectedDeviceId,
            selectedDeviceIdLength: selectedDeviceId?.length 
          });
          
          if (isLoading) {
            console.log('ローディング表示中');
            return (
              <div className="text-center py-8">
                <p className="text-gray-600">カメラを初期化中...</p>
              </div>
            );
          } else if (devices.length === 0) {
            console.log('デバイスなし表示中');
            return (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">カメラが見つかりませんでした</p>
                <p className="text-gray-600 text-sm">
                  ブラウザでカメラのアクセス許可を確認してください
                </p>
              </div>
            );
          } else {
            console.log('カメラ選択とビデオ表示中');
            return (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カメラ選択
                  </label>
                  <select
                    value={selectedDeviceId || ''}
                    onChange={(e) => {
                      const newDeviceId = e.target.value;
                      console.log('カメラデバイス変更:', newDeviceId);
                      setSelectedDeviceId(newDeviceId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isScanning}
                  >
                    {devices.map((device, index) => (
                      <option key={`device-${device.deviceId}-${index}`} value={device.deviceId}>
                        {device.label || `カメラ ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isOptimizedMode}
                      onChange={(e) => setIsOptimizedMode(e.target.checked)}
                      className="rounded"
                      disabled={isScanning}
                    />
                    <span className="text-sm text-gray-700">
                      💡 省電力モード（CPU負荷軽減、読み取り速度低下）
                    </span>
                  </label>
                </div>

                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-200 rounded-md mb-4"
                  playsInline
                  muted
                />

                {isScanning && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-800 border-t-transparent mr-2"></div>
                      <span>
                        QRコードをスキャン中... (試行回数: {scanAttempts})
                        {isOptimizedMode && ' - 省電力モード'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      QRコードをカメラの中央に合わせ、しっかりとフォーカスしてください
                      {isOptimizedMode && ' (500ms間隔でスキャン)'}
                    </p>
                  </div>
                )}
              </>
            );
          }
        })()}

        <div className="flex gap-2">
          {(() => {
            const buttonDisabled = !selectedDeviceId || isLoading;
            console.log('ボタン表示判定:', { 
              isScanning, 
              selectedDeviceId, 
              isLoading,
              buttonDisabled,
              selectedDeviceIdBool: !!selectedDeviceId
            });
            
            if (!isScanning) {
              console.log('スキャン開始ボタンを表示 - disabled:', buttonDisabled);
              return (
                <button
                  onClick={startScanning}
                  disabled={buttonDisabled}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    buttonDisabled 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  style={{ minHeight: '40px' }}
                >
                  📸 {isOptimizedMode ? '省電力' : '高精度'}スキャン開始
                </button>
              );
            } else {
              console.log('スキャン停止ボタンを表示');
              return (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  style={{ minHeight: '40px' }}
                >
                  ⏹️ スキャン停止
                </button>
              );
            }
          })()}
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            キャンセル
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <h4 className="font-medium mb-2">📋 読み取りのコツ:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>QRコードをカメラの中央に配置</li>
            <li>適切な距離を保つ（10-30cm程度）</li>
            <li>十分な明るさを確保</li>
            <li>QRコード全体がフレーム内に入るようにする</li>
            <li>手ブレを避けて安定させる</li>
            {isOptimizedMode && <li className="text-blue-600">💡 省電力モード: 読み取りに時間がかかる場合があります</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodeReader;
