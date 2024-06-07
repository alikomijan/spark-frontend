import React, { PropsWithChildren, useMemo } from "react";
import { makeAutoObservable } from "mobx";

import { FuelNetwork } from "@src/blockchain";
import { SpotMarketTrade } from "@src/entity";
import useVM from "@src/hooks/useVM";
import { IntervalUpdater } from "@src/utils/IntervalUpdater";
import { RootStore, useStores } from "@stores";

const ctx = React.createContext<SpotTradesVM | null>(null);

export const SpotTradesVMProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const rootStore = useStores();
  const store = useMemo(() => new SpotTradesVM(rootStore), [rootStore]);
  return <ctx.Provider value={store}>{children}</ctx.Provider>;
};

export const useSpotTradesVM = () => useVM(ctx);

const UPDATE_TRADES_INTERVAL = 2 * 1000;

class SpotTradesVM {
  public trades: Array<SpotMarketTrade> = [];

  private tradesUpdater: IntervalUpdater;

  amountOfOrders: number = 0;
  setAmountOfOrders = (value: number) => (this.amountOfOrders = value);

  constructor(private rootStore: RootStore) {
    makeAutoObservable(this);
    this.updateTrades().then();

    this.tradesUpdater = new IntervalUpdater(this.updateTrades, UPDATE_TRADES_INTERVAL);

    this.tradesUpdater.run();
  }

  calcSize = (isMobile: boolean) => {
    const orderbookHeight = isMobile ? 380 : window.innerHeight - 210;
    const rowHeight = 17;
    this.setAmountOfOrders(Math.floor((orderbookHeight - 24) / rowHeight));
  };

  updateTrades = async () => {
    const { accountStore, tradeStore, initialized } = this.rootStore;
    const bcNetwork = FuelNetwork.getInstance();

    const market = tradeStore.market;

    if (!initialized || !market) return;

    try {
      const tradesResponse = await bcNetwork!.fetchSpotTrades({
        baseToken: market.baseToken.assetId,
        limit: 50,
      });
      this.trades = tradesResponse;
    } catch (error) {
      console.error("Error with loading trades");
    }
  };
}
