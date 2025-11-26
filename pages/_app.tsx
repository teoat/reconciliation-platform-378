import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import DataProvider from '../components/DataProvider';
import { FrenlyProvider } from '../components/FrenlyProvider';
import '../globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <DataProvider>
          <FrenlyProvider>
            <Component {...pageProps} />
          </FrenlyProvider>
        </DataProvider>
      </PersistGate>
    </Provider>
  );
}
