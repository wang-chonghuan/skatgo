# SKATGO-207 grill

Grill: self (the human: 「开工单，然后开发，直接上线」). Every question answered from the request, the charter and the code.

## Decided for you

1. **Other tiers unchanged.** −20 relegates from Silver up, landing at 0 in the tier below. Basis: Request only names Bronze.
2. **The existing negatives** are lifted to 0 by an idempotent migration at service start. Basis: Scope.
3. **The bar** in Bronze runs 0 → +30; above Bronze −20 → +30 as before. Basis: Scope; ui.md.
4. **About text** EN "+30 points: up a tier. −20: down one, back to 0. In Bronze you never go below 0." / DE "+30 Punkte: eine
   Liga höher. −20: eine tiefer, wieder bei 0. In Bronze geht es nie unter 0." Basis: Scope (说明写明青铜不会低于 0).
5. **League points history** (`league_deals.points`) keeps what each deal brought (−3/−1); only the standing is floored.
