'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface SimpleQRReaderProps {/* これが唯一のプロップス（段ボール箱）= Reactコンポーネントの引数としてのプロパティは一つのみという意味。interface（インターフェース）は、「この部品には、こういうデータを渡してくださいね」という契約書のようなもの */
  onResult: (data: string) => void;/* void: 戻り値はなし（処理するだけでOK）。 */
  onError?: (error: Error) => void;
  className?: string;/* Reactの部品は、ルールとして「引数は『Props』という名前のダンボール箱（オブジェクト）1つだけ」と決まっている。いろんなデータ（onResult, autoStart など）をまとめて1つの箱に入れて渡される。interfaceは「この箱の中には、これとこれが入っていますよ」という**「納品書（中身リスト）」** 。 */
  autoStart?: boolean;  // 自動起動オプションを追加
  autoStop?: boolean;   // 読み取り後に自動停止するかどうか
}

export default function SimpleQRReader({ onResult, onError, className, autoStart = false, autoStop = true }: SimpleQRReaderProps) {/* SimpleQRReaderPropsという箱からonResultなどのデータを取り出して使う(分割代入)。autoStart = false: もし autoStart が入っていなかったら、自動的に false（オフ）にしておくよ、という「初期値」の設定です。 */
  const [isScanning, setIsScanning] = useState(autoStart);  // autoStartがtrueなら最初からスキャン開始
  const [error, setError] = useState<string>('');/* 初期値は空文字 */
  const [lastScannedData, setLastScannedData] = useState<string>(''); // 重複読み取り防止用

  const handleScan = (result: any) => {/* カメラ（Scanner）から渡される「読み取り結果」を受け取ります。any は「どんな形式のデータが来るかわからないから、とりあえず何でも受け取るよ」という意味 */
    console.log('QR Scanner handleScan called:', result);
    
    if (result && result.length > 0) {/* データ（箱）があるのか確認 */
      console.log('結果の詳細:', result);
      
      const firstResult = result[0];
      console.log('最初の結果:', firstResult);

      if (firstResult?.rawValue) {/* データ（箱）の中身は rawValue というラベルが貼ってある文字データが入っているか確認。rawValue とはあらかじめこのライブラリに定義されたプロパティで、スキャンしたQRコードの生データが格納されている。 */
        const data = firstResult.rawValue;
        
        // 重複読み取り防止（連続スキャンモード時）
        if (!autoStop && data === lastScannedData) {
          console.log('重複データのためスキップ');
          return;
        }
        
        console.log('QR Code scanned successfully:', data.substring(0, 100) + '...');
        console.log('データ長:', data.length);
        
        setLastScannedData(data);
        onResult(data);
        
        if (autoStop) {
          setIsScanning(false);
        } else {
          // 連続スキャンの場合、少し待ってから次の読み取りを許可（簡易的なデバウンス）
          setTimeout(() => setLastScannedData(''), 2000);
        }
      } else {
        console.log('❌ rawValueが存在しません:', firstResult);
        setError('QRコードデータの読み取りに失敗しました');
      }
    } else {
      console.log('❌ 結果が空または無効です:', result);
      setError('QRコードが検出されませんでした');
    }
  };

  const handleError = (error: any) => {/* カメラが起動しなかったり、途中で止まったりした時のトラブル対応係 */
    console.error('QR Scanner error:', error);
    let errorMessage = 'スキャンエラーが発生しました';
    
    if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission denied')) {/* NotAllowedError: 「許可されませんでした」というエラー名。'Permission denied': 拒否（Permission denied） */
      errorMessage = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラのアクセスを許可してください。';
    } else if (error?.name === 'NotFoundError' || error?.message?.includes('No camera')) {
      errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
    } else if (error?.name === 'NotSupportedError') {
      errorMessage = 'このブラウザではQRコードスキャンがサポートされていません。';
    } else if (error?.message?.includes('not available')) {
      errorMessage = 'カメラが利用できません。他のアプリでカメラが使用されていないか確認してください。';
    }
    
    setError(errorMessage);
    if (onError) onError(error);/* if (onError !== undefined) {onError(error);} の省略形。 */
  };

  const startScanning = () => {/* 「スキャン開始ボタン」が押された時の動きを定義している部分 */
    setError('');
    setIsScanning(true);
  };

  const stopScanning = () => {/* 「停止ボタン」が押された時の動きを定義している部分 */
    setIsScanning(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>{/* ${className}: 親コンポーネントから渡されたデザイン（Propsの className）もここに追加して適用 */}
      {/* autoStartがfalseの場合のみボタンを表示 */}
      {!autoStart && (/* ユーザーが使っていて autoStart が false になることは絶対にないが、拡張性のために残しておく。 */
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
