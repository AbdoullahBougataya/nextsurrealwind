import { SurrealDBAdapter } from '@/app/api/auth/Auth-Adapter/surrealdb';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { getSurrealClient } from '../../../lib/surrealdb';

export default async function auth(req: any, res: any) {
  if (req.query.nextauth.includes('callback') && req.method === 'POST') {
    console.log(
      'Handling callback request from my Identity Provider',
      req.body
    );
  }

  // Get a custom cookie value from the request
  const someCookie = req.cookies['some-custom-cookie'];
  const providers = [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Sign in with',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        const res = await fetch('/your/endpoint', {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' },
        });
        const user = await res.json();

        // If no error and we have user data, return it
        if (res.ok && user) {
          return user;
        }
        // Return null if user data could not be retrieved
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
      // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
    }),
  ];
  const isDefaultSigninPage =
    req.method === 'GET' && req.query.nextauth.includes('signin');

  // Will hide the `GoogleProvider` when you visit `/api/auth/signin`
  if (isDefaultSigninPage) providers.pop();

  return await NextAuth(req, res, {
    providers,
    adapter: SurrealDBAdapter(getSurrealClient()),
    // pages: {
    //   signIn: '/auth/signin/page',
    //   signOut: '/auth/signout/page',
    //   error: '/auth/error/page', // Error code passed in query string as ?error=
    //   verifyRequest: '/auth/verify-request/page', // (used for check email message)
    //   newUser: '/auth/new-user/page', // New users will be directed here on first sign in (leave the property out if not of interest)
    // },
    callbacks: {
      session({ session, token }) {
        // Return a cookie value as part of the session
        // This is read when `req.query.nextauth.includes("session") && req.method === "GET"`
        return session;
      },
    },
  });
}
