import { useEffect, useState } from "react";
import { Config } from "../../utils/config";
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const PointSendPage: React.FC = () => {
  const HEADER_HEIGHT = 60;
  const { mosaicId } = useParams<{ mosaicId: string }>();
  const location = useLocation();
  const { balance } = location.state as { maxSupply: number, balance: number };
  const [holders, setHolders] = useState<{ address: string, amount: number }[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleCheckboxChange = (address: string) => {
    setSelectedAddresses(prev => {
      if (prev.includes(address)) {
        return prev.filter(addr => addr !== address);
      } else {
        return [...prev, address];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAddresses(holders.map(holder => holder.address));
    } else {
      setSelectedAddresses([]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    if (value === '') {
      setError('');
    } else {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        setError('数値を入力してください');
      } else if (numValue <= 0) {
        setError('0より大きい数値を入力してください');
      } else if (numValue > balance) {
        setError(`配布可能な残高（${balance.toLocaleString()}）を超えています`);
      } else {
        setError('');
      }
    }
  };

  const handleSend = () => {
    // TODO: ポイント配布APIを呼び出す
    console.log('配布先アドレス:', selectedAddresses, '配布数量:', amount);
  };

  useEffect(() => {
    (async () => {
      // TODO: DAO参加者一覧取得APIに変更
      // テスト用データ
      const response = [
        { address: 'ユーザー1', amount: 1000 },
        { address: 'ユーザー2', amount: 500 },
        { address: 'ユーザー3', amount: 100 },
        { address: 'ユーザー4', amount: 100 },
        { address: 'ユーザー5', amount: 100 },
        { address: 'ユーザー6', amount: 100 },
        { address: 'ユーザー7', amount: 100 },
        { address: 'ユーザー8', amount: 100 },
        { address: 'ユーザー9', amount: 100 },
        { address: 'ユーザー10', amount: 100 },
        { address: 'ユーザー11', amount: 100 },
        { address: 'ユーザー12', amount: 100 },
        { address: 'ユーザー13', amount: 100 },
        { address: 'ユーザー14', amount: 100 },
        { address: 'ユーザー15', amount: 100 },
        { address: 'ユーザー16', amount: 100 },
        { address: 'ユーザー17', amount: 100 },
        { address: 'ユーザー18', amount: 100 },
        { address: 'ユーザー19', amount: 100 },
        { address: 'ユーザー20', amount: 100 },
        { address: 'ユーザー21', amount: 100 },
        { address: 'ユーザー22', amount: 100 },
        { address: 'ユーザー23', amount: 100 },
        { address: 'ユーザー24', amount: 100 },
        { address: 'ユーザー25', amount: 100 },
        { address: 'ユーザー26', amount: 100 },
        { address: 'ユーザー27', amount: 0 },
        { address: 'ユーザー28', amount: 0 },
        { address: 'ユーザー29', amount: 0 },
        { address: 'ユーザー30', amount: 0 },
      ];

      // const response = await fetch(`${Config.API_HOST}/point/holders`);
      setHolders(response);
    })();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      gap: '24px', 
      minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
      overflow: 'hidden'
    }}>
      <div style={{ 
        flex: 1,
        overflow: 'auto'
      }}>
        <div style={{
          marginBottom: '16px'
        }}>
          <button
            onClick={() => navigate('/point')}
            style={{
              padding: '16px 0px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#0C1228',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← 戻る
          </button>
        </div>

        <h1 style={{ margin: 0, marginBottom: '20px' }}>ポイント配布</h1>

        <label>配布するポイントID：<span style={{ fontWeight: 'bold' }}>{mosaicId}</span></label>
        <div style={{ 
          marginTop: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          height: '56px'
        }}>
          <label style={{
            marginTop: '4px'
          }}>配布数量：</label>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '4px',
            height: '100%'
          }}>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              style={{
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: '#FFFFFF',
                border: error ? '1px solid #F44336' : 'none',
                width: '200px'
              }}
              min="1"
              max={balance.toString()}
              placeholder="配布するポイント数を入力"
            />
            <div style={{ 
              height: '16px',
              fontSize: '12px',
              color: '#F44336'
            }}>
              {error}
            </div>
          </div>
          <span style={{ 
            color: '#666666',
            fontSize: '14px',
            marginTop: '4px'
          }}>
            上限：{balance.toLocaleString()}
          </span>
        </div>

        <div>
          <div style={{ 
            backgroundColor: '#FFFFFF',
            padding: '12px',
            margin: 0,
            borderRadius: '8px',
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={selectedAddresses.length === holders.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <h2 style={{
                  margin: 0,
                  fontSize: '16px'
                }}>
                  ポイント保有者一覧
                </h2>
              </div>
              <span style={{ fontSize: '14px', color: '#666666' }}>
                {selectedAddresses.length}件選択中
              </span>
            </div>

            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              {holders.map((holder) => (
                <div 
                  key={holder.address}
                  style={{
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minWidth: '250px',
                    flex: '1 1 250px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedAddresses.includes(holder.address)}
                      onChange={() => handleCheckboxChange(holder.address)}
                    />
                    <span>{holder.address}</span>
                  </div>
                  <span>{holder.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleSend}
            disabled={!!error || !amount || selectedAddresses.length === 0}
            style={{
              padding: '8px 16px',
              marginBottom: '20px',
              marginRight: '12px',
              backgroundColor: !!error || !amount || selectedAddresses.length === 0 
                ? '#CCCCCC' 
                : '#0C1228',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !!error || !amount || selectedAddresses.length === 0 
                ? 'not-allowed' 
                : 'pointer'
            }}
          >
            配布する
          </button>
        </div>
      </div>
    </div>
  );
}
