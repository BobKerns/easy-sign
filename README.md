# Project Easy-Sign

This provides an easy-to-use and secure interface to create and use digital signatures within an
application.

# Features
This solves a simpler problem than the bare crypto APIs, which have to concern themselves with
a host of options to interoperate with a wide range of algorithms and data formats. (And it
offers only a small subset of all the options out there).

The focus is on an API that is easy to use in a cryptographically-sound way.
* Ease of use
  * Task-oriented API
  * Limited configuration choices. It is pre-configured to use the appropriate modern algorithms
    at a strength suitable for most cases.
  * Eliminating the requirement for interoperability means you can focus on your application's
    needs, without worrying about what attribute the JWS and JWT standards might specify for
    your need.
  * Supports the large majority of Javascript objects.
  * Supports circular datastructures.
* Follows security best practices out-of-the-box
  * Proper use of salt and iv handled automatically.
  * Keystores are encrypted under a password and PEM-formatted

Key and hashing algorithm strengths are chosen to be one step down from maximum. This is
appropriate for most situations in which this package would be appropriate. The typical usage
would not be fending off attacks with large resources to mount against a high-value target. If
that describes your situation, you probably should invest in learning all the ins and outs of
the Javascript crypto APIs, and the larger world of crypto algorithms and formats.

But that's a daunting task, and if wanted, I can enable a "MAX SECURITY" mode.

But the uses I envision are generally lower-value targets, for shorter-duration usage.
The chosen strengths should be overkill for this type of usage.

Particular attention is paid to password-protecting the keys. You should protect both the
private key and its password to the best of your ability, ideally keeping them separate until
the time and place of usage. The public key password should be entirely different.
