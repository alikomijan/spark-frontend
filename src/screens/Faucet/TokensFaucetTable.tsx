import React from "react";
import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";

import Chip from "@components/Chip";
import { Row } from "@components/Flex";
import { TableText } from "@components/Table";
import Text, { TEXT_TYPES, TEXT_TYPES_MAP } from "@components/Text";
import { SmartFlex } from "@src/components/SmartFlex";
import { useStores } from "@stores";

import MintButtons from "./MintButtons";

interface IProps {}

const TokensFaucetTable: React.FC<IProps> = observer((assetId) => {
  const { faucetStore } = useStores();
  return (
    <Root className="better-scroll">
      <StyledTableRow>
        <TableTitle>Asset</TableTitle>
        <TableTitle>Mint amount</TableTitle>
        <TableTitle>My balance</TableTitle>
        <TableTitle>
          <Row justifyContent="flex-end">{/*<Button style={{ width: 120 }}>Mint all</Button>*/}</Row>
        </TableTitle>
      </StyledTableRow>
      <TableBody>
        {faucetStore.faucetTokens.map((token) => (
          <StyledTableRow key={token.assetId}>
            <TableText type={TEXT_TYPES.BUTTON_SECONDARY} primary>
              {token.name}
            </TableText>
            <TableText type={TEXT_TYPES.BUTTON_SECONDARY} primary>
              {token.mintAmount.toSignificant(3)} &nbsp;<Chip>{token.symbol}</Chip>
            </TableText>
            <TableText type={TEXT_TYPES.BUTTON_SECONDARY} primary>
              {token.formatBalance?.toSignificant(3)} &nbsp;<Chip>{token.symbol}</Chip>
            </TableText>
            <MintButtons assetId={token.assetId} />
          </StyledTableRow>
        ))}
      </TableBody>
    </Root>
  );
});

export default TokensFaucetTable;

const Root = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  display: flex;
  width: 100%;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.bgSecondary};
  overflow: hidden;
  border-radius: 10px;
  overflow-x: auto;
  max-width: 100%;

  & > * {
    min-width: 580px;
  }
`;

const StyledTableRow = styled(SmartFlex)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;

  margin-bottom: 1px;
  height: 48px;
  background: ${({ theme }) => theme.colors.bgPrimary};
  align-items: center;
  padding: 0 12px;

  & > :last-child {
    justify-self: flex-end;
  }
`;

const TableTitle = styled(Text)`
  flex: 1;
  white-space: nowrap;
  ${TEXT_TYPES_MAP[TEXT_TYPES.SUPPORTING]}
`;

const TableBody = styled(SmartFlex)`
  flex-direction: column;
  width: 100%;
`;
