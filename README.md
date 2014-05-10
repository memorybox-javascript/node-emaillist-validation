This is a tool which takes a list of email addresses and verifys them for: 

Verifying they contain an @ sign
Verifying the domainname has an MX record and A record
And that an SMTP server is running
And the smtp server responds positively when attempting to send to each email address.

There are many paid email list cleaning services services which do the same thing e.g. http://www.emailanswers.com/  and http://www.briteverify.com/ 

Note this is not really a good way to verify a (large) email list because ISPs will consider this spammy behaviour and a dictionary attack and likely block you after a while. see more details at http://www.spamresource.com/2010/11/email-address-validation-options.html