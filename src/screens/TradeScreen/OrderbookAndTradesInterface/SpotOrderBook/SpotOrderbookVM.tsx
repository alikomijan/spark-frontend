import React, { useMemo } from "react";
import { makeAutoObservable, reaction } from "mobx";

import { DEFAULT_DECIMALS } from "@src/constants";
import { SpotMarketOrder } from "@src/entity";
import useVM from "@src/hooks/useVM";
import BN from "@src/utils/BN";
import { IntervalUpdater } from "@src/utils/IntervalUpdater";
import { RootStore, useStores } from "@stores";

const ctx = React.createContext<SpotOrderbookVM | null>(null);

interface IProps {
  children: React.ReactNode;
}

export const SpotOrderbookVMProvider: React.FC<IProps> = ({ children }) => {
  const rootStore = useStores();
  const store = useMemo(() => new SpotOrderbookVM(rootStore), [rootStore]);
  return <ctx.Provider value={store}>{children}</ctx.Provider>;
};

export const useSpotOrderbookVM = () => useVM(ctx);

type TOrderbookData = {
  buy: Array<SpotMarketOrder>;
  sell: Array<SpotMarketOrder>;
  spreadPercent: string;
  spreadPrice: string;
};

const UPDATE_INTERVAL = 10 * 1000;

class SpotOrderbookVM {
  rootStore: RootStore;

  orderbook: TOrderbookData = {
    buy: [],
    sell: [],
    spreadPercent: "0.00",
    spreadPrice: "",
  };
  decimalKey: string = "0";
  orderFilter: number = 0;
  amountOfOrders: number = 0;

  isOrderBookLoading = false;

  private orderBookUpdater: IntervalUpdater;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);

    reaction(
      () => rootStore.initialized,
      (initialized) => {
        if (!initialized) return;

        this.orderBookUpdater.update();
      },
    );

    this.orderBookUpdater = new IntervalUpdater(this.updateOrderBook, UPDATE_INTERVAL);

    this.orderBookUpdater.run(true);
  }

  get oneSizeOrders() {
    return +new BN(this.amountOfOrders).div(2).toFixed(0) - 1;
  }

  get buyOrders() {
    return this.orderbook.buy
      .slice()
      .sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null && b.price !== null) return 1;
        if (a.price === null && b.price === null) return -1;
        return a.price.lt(b.price) ? 1 : -1;
      })
      .reverse()
      .slice(this.orderFilter === 0 ? -this.oneSizeOrders : -this.amountOfOrders)
      .reverse();
  }

  get sellOrders() {
    return this.orderbook.sell
      .slice()
      .sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null && b.price !== null) return 1;
        if (a.price === null && b.price === null) return -1;
        return a.price.lt(b.price) ? 1 : -1;
      })
      .slice(this.orderFilter === 0 ? -this.oneSizeOrders : -this.amountOfOrders);
  }

  get totalBuy() {
    return this.buyOrders.reduce((acc, order) => acc.plus(order.quoteSize), BN.ZERO);
  }

  get totalSell() {
    return this.sellOrders.reduce((acc, order) => acc.plus(order.baseSize), BN.ZERO);
  }

  calcSize = (isMobile: boolean) => {
    const orderbookHeight = isMobile ? 380 : window.innerHeight - 210;
    const rowHeight = 17;
    this.setAmountOfOrders(Math.floor((orderbookHeight - 24) / rowHeight));
  };

  setAmountOfOrders = (value: number) => (this.amountOfOrders = value);

  setDecimalKey = (value: string) => (this.decimalKey = value);

  setOrderFilter = (value: number) => (this.orderFilter = value);

  updateOrderBook = async () => {
    const { tradeStore, blockchainStore } = this.rootStore;

    const market = tradeStore.market;

    if (!this.rootStore.initialized || !market) return;

    const bcNetwork = blockchainStore.currentInstance;
    const limit = 20;

    this.isOrderBookLoading = true;

    const [buy, sell] = await Promise.all([
      bcNetwork!.fetchOrders({ baseToken: market.baseToken.assetId, type: "BUY", limit }),
      bcNetwork!.fetchOrders({ baseToken: market.baseToken.assetId, type: "SELL", limit }),
    ]);

    //bid = max of buy
    const buyPrices = buy.map((order) => order.price);
    const maxBuyPrice = buyPrices.reduce((max, current) => (current.gt(max) ? current : max), buyPrices[0]);

    //ask = min of sell
    const sellPrices = sell.map((order) => order.price);
    const minSellPrice = sellPrices.reduce((min, current) => (current.lt(min) ? current : min), sellPrices[0]);

    if (maxBuyPrice && minSellPrice) {
      // spread = ask - bid
      const spread = minSellPrice.minus(maxBuyPrice);
      const formattedSpread = BN.formatUnits(spread, DEFAULT_DECIMALS).toSignificant(2);

      const spreadPercent = minSellPrice.minus(maxBuyPrice).div(maxBuyPrice).times(100);
      this.setOrderbook({ buy, sell, spreadPercent: spreadPercent.toFormat(2), spreadPrice: formattedSpread });
      this.isOrderBookLoading = false;
      return;
    }

    this.setOrderbook({ buy, sell, spreadPercent: "0.00", spreadPrice: "0.00" });
    this.isOrderBookLoading = false;
  };

  private setOrderbook = (orderbook: TOrderbookData) => (this.orderbook = orderbook);
}
