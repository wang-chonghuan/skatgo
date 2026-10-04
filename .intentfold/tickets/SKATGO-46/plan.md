# Implementation

Existing public pages render through ClientPage, use pageHead and derive localized sitemap
coverage from file routes and PAGES. Public landing pages have no footer. The current
Clerk SDK uses appearance.options, not the older layout property.

Content readers: a learner deciding whether to use an account needs to know what SkatGo
does with their data and how to contact its operator; a learner using games needs the
service's usage rules. Privacy answers the first question, Terms the second. Operator
details come first, followed by the actual data flows or usage rules and cross-links.
Facts come from the approved operator details and current processing, not generic promises.

1. Add factual bilingual legal content, two thin routes, translated address patterns and
   sitemap entries. Reuse the site's existing entry sharing image.
2. Render both documents with the current reading-column tokens. Add localized legal links
   below public pages and in Clerk's modal. No changes to tokens, dependencies or auth gates.
3. Run the required mechanical defence. Check both documents and navigation at both
   Operations viewports, with and without JavaScript, including canonical and alternates.
4. Record the code-ready preview, user-approved operator/contact and outstanding production
   OAuth acceptance. Do not write a successful handoff until the ticket's full AC pass.

Redline lookup: no credentials in files, no generated route-tree edits, no new stylesheet
or literal design values, no changed production data/infrastructure or Charter. The human
explicitly requested the code addition within this ticket; finish remains review.
