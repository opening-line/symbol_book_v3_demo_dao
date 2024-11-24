import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const DaoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDaoAccount, setIsDaoAccount] = useState<boolean>(false);

  // 自分がDAOアカウントの連署者であるかどうかを確認
  useEffect(() => {
    (async () => {
      // TODO: DAOデータ取得APIに変更
      const isDaoAccount = true;
      setIsDaoAccount(isDaoAccount);
    })();
  }, []);

  return (
    <div>
      <h1>DAO設定</h1>
      {!isDaoAccount ? (
        // DAOアカウントがない場合
        <button
          onClick={() => navigate('/dao/create')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#181F39',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          DAOを作成する
        </button>
      ) : (
        // DAOアカウントがある場合
        <div>
          <h2>DAO管理者設定</h2>
          <p>このボタンからUpdate.tsxに遷移するようにしてるけど不要かも？</p>
          <p>サイドメニューから遷移する際にDAOあるかどうか判定して分岐させても良さそう？</p>
          <button
            onClick={() => navigate('/dao/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#181F39',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            DAO管理者を設定する
          </button>
        </div>
      )}
    </div>
  );
}
