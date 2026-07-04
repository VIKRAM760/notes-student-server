export interface Course {
  id: string;
  name: string;
  topics: string[]; // topic slugs from the notes site this course unlocks
}

export const courses: Course[] = [
  {
    id: 'frontend-development',
    name: 'Frontend Development',
    topics: ['html', 'css', 'javascript', 'typescript', 'react', 'react-native'],
  },
  {
    id: 'backend-development',
    name: 'Backend Development',
    topics: ['javascript', 'nodejs', 'mongodb', 'restful-api'],
  },
  {
    id: 'tools-devops',
    name: 'Tools & Collaboration',
    topics: ['github', 'bitbucket', 'restful-api'],
  },
  {
    id: 'fullstack-development',
    name: 'Full-Stack Development',
    topics: [
      'html',
      'css',
      'javascript',
      'typescript',
      'react',
      'react-native',
      'nodejs',
      'mongodb',
      'nextjs',
      'redux',
      'github',
      'bitbucket',
      'restful-api',
    ],
  },
];

export const getCourseById = (id: string): Course | undefined =>
  courses.find((c) => c.id === id);
