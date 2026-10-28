# SKATGO-147 rework

Three rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「头像太小了，需要增大」** (becdb3a). Faces 108u on a wide table (100px at 1280×820, was 74px) and 84u in portrait
   (79px at 375×812, was 60px); the stage's room for them 116u / 110u, at least 10u under the band in portrait; the
   band's talk keeps between the larger faces. Rechecked: no overlap at 1280×820, 375×812, 375×667; the hand's card
   unchanged at 1280×820 and 375×812, 76px at 375×667 (90px before the ticket).
2. **「null你没处理好，null是反过来的」** (66cf1e9). In a Null the declarer taking a trick sulks and the defenders laugh;
   a trick a defender takes makes the declarer laugh and the defenders sulk. Rechecked: the face unit test (two Null
   cases added).
3. **「配置里要加上一个配置：关闭table talk，关闭头像，默认是开的」** (3a251de). Settings: "Avatars" / "Avatare" — "Lina's
   and Noah's avatars at the table", on by default, under the existing table-talk switch (which already turned the
   talk off); off, no faces at the table, kept in this browser. Rechecked: switched off and on in the table's settings
   dialog, faces gone and back, the choice stored.

Net effect: bigger faces that reverse in a Null, and a switch to hide them. Mechanical defence passed once on the
final branch (294 tests).
