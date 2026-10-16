# SKATGO-108 acceptance checks (built server; desktop 1280×820 and phone 375×812)

1. `/de/skat-tricks`: the first card is the ladder; opened it lists 10 exercises in rising difficulty (level and tricks left shown).
2. A level-2 exercise shows only the situation line, your cards, the skat and the play record (no opponents' cards); a level-1 one also lists the outstanding cards and voids; a level-3 one has no points in its situation line.
3. Answering (once wrong, once right): the verdict, the reasoning from the voids, the opponents' cards, the sure line with points, and the traps show.
4. `npm --prefix app run test`: every ladder exercise proven — the answer sure in every split consistent with the voids, every other legal card with a losing split.
5. `/en/skat-tricks` and an English ladder exercise work the same.
6. Mechanical defence per engineering.md Tools.
