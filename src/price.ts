import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import axios from 'axios';
import { EXTENSION_NAME } from './constants';
import { AllCurrencies, Currency } from './types';

const WSS_URL = 'wss://webws.gateio.live/v3/';

const CLIENT_ID = getRandomInt(1e7);

const UP_COLOR = '#43a047';

const DOWN_COLOR = '#bb616b';

const CURRENCY_STATE = 'allCurrencies';

const matchCurrencyRe = /marketlist_all_currs\s?=\s?([^;]+)/;

const coinStatusBarItems = new Map<string, vscode.StatusBarItem>();

const currencyInfoMaps = new Map<string, Currency | undefined>();

let timeout: NodeJS.Timeout;

let allCurrencies: AllCurrencies = {
  spot: [],
  etf: [],
};

let socket: WebSocket;

function getRandomInt(range: number) {
  return Math.floor(Math.random() * Math.floor(range));
}

function socketSendCmd(
  socket: WebSocket,
  method: string,
  params: any[] = [],
  id: number = CLIENT_ID,
) {
  socket.send(
    JSON.stringify({
      id,
      method,
      params,
    }),
  );
}

function getCoinConfig(coin: string) {
  const sign = coin.match(/3s|3l|5s|5l/i);

  return allCurrencies[sign ? 'etf' : 'spot'].find(
    (item) => item.pair.toUpperCase() === coin.toUpperCase(),
  );
}

function heartbeat(context: vscode.ExtensionContext) {
  clearInterval(timeout);
  timeout = setInterval(() => {
    if (socket?.readyState === WebSocket.CLOSED) {
      reopenWebSocket(context);
    }
  }, 60 * 1000);
}

export async function createPriceTag(context: vscode.ExtensionContext) {
  heartbeat(context);

  const currenciesState = context.globalState.get<AllCurrencies>(CURRENCY_STATE);

  if (!currenciesState) {
    try {
      const res = await axios.get<string>('https://www.gateio.ch/cn/trade/BTC_USDT');
      const result = res.data.match(matchCurrencyRe);
      if (result) {
        allCurrencies = JSON.parse(result[1]);
        context.globalState.update(CURRENCY_STATE, allCurrencies);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    allCurrencies = currenciesState;
  }

  const config = vscode.workspace.getConfiguration();
  const coinSymbols =
    config
      .get<string[]>(`${EXTENSION_NAME}.coinSymbols`)
      ?.map((coin) => `${coin}_usdt`.toUpperCase()) ?? [];

  // create StatusBarItem for each coin
  coinSymbols.forEach((coin, index) => {
    const statusBarCoinSymbol = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      2 * (coinSymbols.length - index),
    );
    coinStatusBarItems.set(`${coin}-SYMBOL`, statusBarCoinSymbol);

    const statusBarCoinValue = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      2 * (coinSymbols.length - index) - 1,
    );
    coinStatusBarItems.set(`${coin}-VALUE`, statusBarCoinValue);

    currencyInfoMaps.set(coin, getCoinConfig(coin));
  });

  socket = new WebSocket(`${WSS_URL}?v=${getRandomInt(1e6)}`);

  socket.on('open', () => {
    socketSendCmd(socket, 'server.ping');
    socketSendCmd(socket, 'ticker.subscribe', coinSymbols);
    socketSendCmd(socket, 'price.subscribe', coinSymbols);
  });

  function updateCoinPrice(
    coin: string,
    price: string | number,
    change: string | number,
  ) {
    const statusBarCoinSymbol = coinStatusBarItems.get(`${coin}-SYMBOL`);
    const statusBarCoinValue = coinStatusBarItems.get(`${coin}-VALUE`);
    if (statusBarCoinSymbol && statusBarCoinValue) {
      statusBarCoinSymbol.text = `${coin.match(/[a-z]+/i)![0]}`;
      statusBarCoinSymbol.show();

      let priceStr = price.toString();
      const info = currencyInfoMaps.get(coin);
      if (info) {
        // format price
        priceStr = Number(price).toFixed(info.prec_r);
      }

      const changeStr = Number(change).toFixed(2);

      statusBarCoinValue.text = `$${priceStr}　${
        change > 0 ? `$(triangle-up) +${changeStr}` : `$(triangle-down) ${changeStr}`
      }%　　`;

      statusBarCoinValue.color = change < 0 ? DOWN_COLOR : UP_COLOR;
      statusBarCoinValue.show();
    }
  }

  socket.on('message', (message) => {
    const data = JSON.parse(message.toString());

    switch (data.method) {
      case 'ticker.update':
        {
          const [coin, realtime] = data.params;
          const { change, last: price } = realtime;
          updateCoinPrice(coin, price, change);
        }
        break;
      case 'price.update':
        {
          const [coin, realtime] = data.params;
          const { change, price } = realtime;
          updateCoinPrice(coin, price, change);
        }
        break;
    }
  });

  socket.on('error', (err) => {
    console.log(err);
    reopenWebSocket(context);
  });

  socket.on('close', () => {
    reopenWebSocket(context);
  });
}

export function reopenWebSocket(context: vscode.ExtensionContext) {
  if (socket.readyState === WebSocket.OPEN) {
    socket?.close();
  }
  coinStatusBarItems.forEach((item) => item.dispose());
  coinStatusBarItems.clear();

  createPriceTag(context);
}

export async function updateCurrencyConfig(context: vscode.ExtensionContext) {
  await context.globalState.update(CURRENCY_STATE, undefined);

  reopenWebSocket(context);
}